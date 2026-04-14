import { Op } from 'sequelize';
import { Floor, Area, AreaChecklistSchedule, AreaChecklistExecution, Checklist, User } from '../models';

class AreaRepository {
  async getFloorsBySiteId(siteId: string, orgId: string) {
    return Floor.findAll({ where: { site_id: siteId, org_id: orgId }, order: [['level', 'ASC']] });
  }

  async getFloorById(id: string, orgId: string) {
    return Floor.findOne({ where: { id, org_id: orgId } });
  }

  async createFloor(data: any) {
    return Floor.create(data);
  }

  async updateFloor(id: string, orgId: string, data: any) {
    await Floor.update(data, { where: { id, org_id: orgId } });
    return this.getFloorById(id, orgId);
  }

  async deleteFloor(id: string, orgId: string) {
    return Floor.destroy({ where: { id, org_id: orgId } });
  }

  async getAreasByFloorId(floorId: string, orgId: string) {
    return Area.findAll({ where: { floor_id: floorId, org_id: orgId } });
  }

  async getAreaById(id: string, orgId: string) {
    return Area.findOne({ where: { id, org_id: orgId } });
  }

  async getAreaByQrHash(qrHash: string) {
    return Area.findOne({ where: { qr_code_hash: qrHash } });
  }

  async createArea(data: any) {
    return Area.create(data);
  }

  async updateArea(id: string, orgId: string, data: any) {
    await Area.update(data, { where: { id, org_id: orgId } });
    return this.getAreaById(id, orgId);
  }

  async deleteArea(id: string, orgId: string) {
    return Area.destroy({ where: { id, org_id: orgId } });
  }

  async getSchedulesByAreaId(areaId: string, orgId: string, recordStatus: string = 'active') {
    const where: any = { area_id: areaId, org_id: orgId };
    let paranoid = true;
    
    if (recordStatus === 'inactive') {
      paranoid = false;
      where.deleted_at = { [Op.not]: null };
    }

    return AreaChecklistSchedule.findAll({ 
      where,
      paranoid,
      include: [{ model: Checklist, as: 'template', paranoid: false }]
    });
  }

  async getScheduleById(id: string, orgId: string) {
    return AreaChecklistSchedule.findOne({ where: { id, org_id: orgId } });
  }

  async createSchedule(data: any) {
    return AreaChecklistSchedule.create(data);
  }

  async updateSchedule(id: string, orgId: string, data: any) {
    await AreaChecklistSchedule.update(data, { where: { id, org_id: orgId } });
    return this.getScheduleById(id, orgId);
  }

  async deleteSchedule(id: string, orgId: string, force: boolean = false) {
    return AreaChecklistSchedule.destroy({ where: { id, org_id: orgId }, force });
  }

  async restoreSchedule(id: string, orgId: string) {
    const schedule = await AreaChecklistSchedule.findOne({ where: { id, org_id: orgId }, paranoid: false });
    if (schedule) {
      await schedule.restore();
      return true;
    }
    return false;
  }

  async getExecutions(orgId: string, filters: any = {}) {
    const where: any = { org_id: orgId };

    if (filters.status) {
      where.status = filters.status.split(',');
    }
    if (filters.area_id) {
      where.area_id = filters.area_id;
    }

    return AreaChecklistExecution.findAll({
      where,
      include: [
        { model: Area, as: 'area', include: [{ model: Floor }] },
        { model: Checklist, as: 'checklist_instance' },
        { model: User, as: 'completer', attributes: ['id', 'first_name', 'last_name', 'email'] }
      ],
      order: [['scheduled_for', 'DESC']]
    });
  }

  async getExecutionById(id: string, orgId: string) {
    return AreaChecklistExecution.findOne({
      where: { id, org_id: orgId },
      include: [
        { model: Area, as: 'area' },
        { model: Checklist, as: 'checklist_instance' }
      ]
    });
  }

  async updateExecution(id: string, orgId: string, data: any) {
    await AreaChecklistExecution.update(data, { where: { id, org_id: orgId } });
    return this.getExecutionById(id, orgId);
  }
}

export default new AreaRepository();