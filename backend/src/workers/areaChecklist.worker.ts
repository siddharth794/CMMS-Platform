import cronParser from 'cron-parser';
import { Op } from 'sequelize';
import { AreaChecklistSchedule, AreaChecklistExecution, Checklist, Area } from '../models';
import logger from '../config/logger';
import checklistService from '../services/checklist.service';

export class AreaChecklistWorker {
  public async evaluateAllActiveSchedules() {
    try {
      logger.info('Starting Area Checklist Schedule Evaluation...');
      
      const schedules = await AreaChecklistSchedule.findAll({
        where: { is_active: true },
        include: [{ model: Area, as: 'area' }]
      });

      let generatedCount = 0;
      let missedCount = 0;

      const now = new Date();

      for (const pm of schedules) {
        const schedule: any = pm;

        // 1. Mark overdue PENDING tasks as MISSED
        const overdueExecutions = await AreaChecklistExecution.findAll({
          where: {
            schedule_id: schedule.id,
            status: 'PENDING',
            scheduled_for: {
              [Op.lt]: new Date(now.getTime() - 60 * 60 * 1000) // 1 hour grace period
            }
          }
        });

        for (const exec of overdueExecutions) {
          await exec.update({ status: 'MISSED' });
          missedCount++;
        }

        // 2. Check if there's already an active (PENDING or IN_PROGRESS) execution for this schedule
        const activeExecutions = await AreaChecklistExecution.count({
          where: {
            schedule_id: schedule.id,
            status: { [Op.in]: ['PENDING', 'IN_PROGRESS'] }
          }
        });

        if (activeExecutions > 0) {
          continue; // Skip if there's already an active execution
        }

        // 3. Evaluate cron expression to see if it's time to generate
        let shouldTrigger = false;
        let scheduledDate: Date | null = null;

        try {
          const interval = cronParser.parse(schedule.cron_expression);
          const nextDate = interval.next().toDate();
          
          // If the next run time is within the next 15 minutes, trigger it
          const leadTimeMs = 15 * 60 * 1000;
          
          if (nextDate.getTime() <= now.getTime() + leadTimeMs) {
            shouldTrigger = true;
            scheduledDate = nextDate;
          }
        } catch (err) {
          logger.error(`Error parsing cron expression for Schedule ID ${schedule.id}`);
        }

        if (shouldTrigger && scheduledDate) {
          await this.generateExecution(schedule, scheduledDate);
          generatedCount++;
        }
      }

      logger.info(`Finished Area Evaluation. Generated ${generatedCount} tasks. Marked ${missedCount} missed.`);
    } catch (error) {
      logger.error({ error }, 'Failed to evaluate Area Checklist schedules');
    }
  }

  private async generateExecution(schedule: any, scheduledStart: Date) {
    // We need to clone the checklist template
    const templateId = schedule.checklist_template_id;

    // Create execution record first
    const execution: any = await AreaChecklistExecution.create({
      org_id: schedule.org_id,
      schedule_id: schedule.id,
      area_id: schedule.area_id,
      checklist_id: templateId, // Placeholder until clone
      status: 'PENDING',
      scheduled_for: scheduledStart
    });

    // Clone the checklist
    // To do this properly, we use a service function or directly copy it here
    // Let's use the checklistService.cloneChecklistForWorkOrder equivalent, but adapted for area
    const newChecklist = await this.cloneChecklistForArea(templateId, schedule.area_id, execution.id, schedule.org_id);
    
    // Update execution with new checklist ID
    await execution.update({ checklist_id: newChecklist.id });
    
    // Socket.IO emission could happen here to notify active cleaners
  }

  private async cloneChecklistForArea(templateId: string, areaId: string, executionId: string, orgId: string) {
    // 1. Get template
    const template: any = await Checklist.findOne({ where: { id: templateId, org_id: orgId } });
    if (!template) throw new Error('Template not found');

    // 2. Clone checklist
    const newChecklist: any = await Checklist.create({
      org_id: orgId,
      name: `${template.name} - Area Run`,
      description: template.description,
      is_template: false,
      is_required: true,
      area_id: areaId,
      area_execution_id: executionId,
      created_by: template.created_by
    });

    // 3. Clone items
    const items = await template.getItems(); // using association method if it exists, otherwise manual fetch
    
    // Fallback manual fetch if getItems doesn't work out of the box with ts types:
    const { ChecklistItem } = require('../models');
    const templateItems = await ChecklistItem.findAll({ where: { checklist_id: templateId } });

    for (const item of templateItems) {
      await ChecklistItem.create({
        checklist_id: newChecklist.id,
        description: (item as any).description,
        order_index: (item as any).order_index
      });
    }

    return newChecklist;
  }
}