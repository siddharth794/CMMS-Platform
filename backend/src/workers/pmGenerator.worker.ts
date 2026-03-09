import cronParser from 'cron-parser';
import { Op } from 'sequelize';
import { PMSchedule, PMTrigger, PMTemplate, PMTask, PMPart, PMExecution, WorkOrder, Asset } from '../models';
import logger from '../config/logger';

export class PMGeneratorWorker {
  public async evaluateAllActivePMs() {
    try {
      logger.info('Starting PM Generation Evaluation Loop...');
      const schedules = await PMSchedule.findAll({
        where: { is_active: true, is_paused: false },
        include: [
          { model: PMTrigger, as: 'triggers' },
          { model: PMTemplate, as: 'template' },
          { model: PMTask, as: 'tasks' },
          { model: PMPart, as: 'parts' },
          { model: Asset }
        ]
      });

      let generatedCount = 0;

      for (const pm of schedules) {
        const schedule: any = pm; // bypass TS checking for virtual populated fields
        // Check if there's already an open WO for this PM to avoid duplicates
        const openExecutions = await PMExecution.count({
          where: {
            pm_schedule_id: schedule.id,
            status: 'generated'
          }
        });

        if (openExecutions > 0) {
          continue; // Skip this PM if it already has a generated but incomplete WO
        }

        let shouldTrigger = false;
        let triggeredBy = '';
        let triggeredDate: Date | null = null;

        for (const trigger of schedule.triggers || []) {
          if (trigger.trigger_type === 'TIME' && trigger.cron_expression) {
            try {
              const interval = cronParser.parse(trigger.cron_expression);
              const nextDate = interval.next().toDate();
              const now = new Date();
              const leadTimeMs = (trigger.lead_time_days || 0) * 24 * 60 * 60 * 1000;
              
              if (nextDate.getTime() <= now.getTime() + leadTimeMs) {
                shouldTrigger = true;
                triggeredBy = 'TIME';
                triggeredDate = nextDate;
                break;
              }
            } catch (err) {
              logger.error(`Error parsing cron expression for Trigger ID ${trigger.id}`);
            }
          }
          // Note: METER triggers would evaluate asset.current_meter_reading vs trigger.meter_interval here.
        }

        if (shouldTrigger) {
          await this.generateWorkOrder(schedule, triggeredBy, triggeredDate);
          generatedCount++;
        }
      }
      logger.info(`Finished PM Generation Evaluation. Generated ${generatedCount} new Work Orders.`);
    } catch (error) {
      logger.error({ error }, 'Failed to evaluate PM schedules');
    }
  }

  private async generateWorkOrder(schedule: any, triggeredBy: string, scheduledStart: Date | null) {
    const template = schedule.template || {};
    
    // Auto-generate WO Number
    const count = await WorkOrder.count();
    const woNumber = `WO-${new Date().getFullYear()}${(count + 1).toString().padStart(4, '0')}`;

    const newWO = await WorkOrder.create({
      org_id: schedule.org_id,
      asset_id: schedule.asset_id,
      title: `PM: ${schedule.name}`,
      description: schedule.description || 'Auto-generated Preventive Maintenance',
      wo_number: woNumber,
      status: 'new',
      priority: template.priority || 'medium',
      assignee_id: template.assignee_id || null,
      estimated_hours: template.estimated_hours || null,
      scheduled_start: scheduledStart,
      is_pm_generated: true
    });

    // We can insert tasks into a work_order_tasks table if it existed, for now we log it in execution
    await PMExecution.create({
      pm_schedule_id: schedule.id,
      work_order_id: newWO.id,
      triggered_by: triggeredBy,
      status: 'generated'
    });

    logger.info(`Generated Work Order ${woNumber} from PM Schedule ${schedule.name}`);
  }
}
