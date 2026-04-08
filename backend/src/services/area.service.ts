import areaRepository from '../repositories/area.repository';
import { NotFoundError, BadRequestError } from '../errors/AppError';
import QRCode from 'qrcode';

class AreaService {
  async getFloors(siteId: string, orgId: string) {
    return areaRepository.getFloorsBySiteId(siteId, orgId);
  }

  async createFloor(orgId: string, data: any) {
    return areaRepository.createFloor({ ...data, org_id: orgId });
  }

  async updateFloor(id: string, orgId: string, data: any) {
    const floor = await areaRepository.getFloorById(id, orgId);
    if (!floor) throw new NotFoundError('Floor not found');
    return areaRepository.updateFloor(id, orgId, data);
  }

  async deleteFloor(id: string, orgId: string) {
    const floor = await areaRepository.getFloorById(id, orgId);
    if (!floor) throw new NotFoundError('Floor not found');
    return areaRepository.deleteFloor(id, orgId);
  }

  async getAreas(floorId: string, orgId: string) {
    return areaRepository.getAreasByFloorId(floorId, orgId);
  }

  async getAreaById(id: string, orgId: string) {
    const area = await areaRepository.getAreaById(id, orgId);
    if (!area) throw new NotFoundError('Area not found');
    return area;
  }

  async createArea(orgId: string, data: any) {
    return areaRepository.createArea({ ...data, org_id: orgId });
  }

  async updateArea(id: string, orgId: string, data: any) {
    const area = await areaRepository.getAreaById(id, orgId);
    if (!area) throw new NotFoundError('Area not found');
    return areaRepository.updateArea(id, orgId, data);
  }

  async deleteArea(id: string, orgId: string) {
    const area = await areaRepository.getAreaById(id, orgId);
    if (!area) throw new NotFoundError('Area not found');
    return areaRepository.deleteArea(id, orgId);
  }

  async generateAreaQrCode(id: string, orgId: string) {
    const area: any = await this.getAreaById(id, orgId);
    const qrData = JSON.stringify({ area_id: area.id, qr_code_hash: area.qr_code_hash });
    const qrImage = await QRCode.toDataURL(qrData);
    return { area, qrImage };
  }

  async getSchedules(areaId: string, orgId: string) {
    return areaRepository.getSchedulesByAreaId(areaId, orgId);
  }

  async createSchedule(areaId: string, orgId: string, data: any) {
    const area = await areaRepository.getAreaById(areaId, orgId);
    if (!area) throw new NotFoundError('Area not found');
    return areaRepository.createSchedule({ ...data, area_id: areaId, org_id: orgId });
  }

  async updateSchedule(id: string, orgId: string, data: any) {
    const schedule = await areaRepository.getScheduleById(id, orgId);
    if (!schedule) throw new NotFoundError('Schedule not found');
    return areaRepository.updateSchedule(id, orgId, data);
  }

  async deleteSchedule(id: string, orgId: string) {
    const schedule = await areaRepository.getScheduleById(id, orgId);
    if (!schedule) throw new NotFoundError('Schedule not found');
    return areaRepository.deleteSchedule(id, orgId);
  }

  async getExecutions(orgId: string, filters: any = {}) {
    return areaRepository.getExecutions(orgId, filters);
  }

  async verifyQrAndStartTask(executionId: string, qrHash: string, orgId: string, userId: string) {
    const execution: any = await areaRepository.getExecutionById(executionId, orgId);
    if (!execution) throw new NotFoundError('Execution task not found');

    if (execution.status !== 'PENDING') {
      throw new BadRequestError(`Task is already ${execution.status}`);
    }

    if (execution.area.qr_code_hash !== qrHash) {
      throw new BadRequestError('Invalid QR Code for this area');
    }

    return areaRepository.updateExecution(executionId, orgId, {
      status: 'IN_PROGRESS',
      started_at: new Date()
    });
  }

  async completeTask(executionId: string, orgId: string, userId: string) {
    const execution: any = await areaRepository.getExecutionById(executionId, orgId);
    if (!execution) throw new NotFoundError('Execution task not found');

    if (execution.status !== 'IN_PROGRESS') {
      throw new BadRequestError(`Task must be IN_PROGRESS to complete. Current status: ${execution.status}`);
    }

    return areaRepository.updateExecution(executionId, orgId, {
      status: 'COMPLETED',
      completed_at: new Date(),
      completed_by: userId
    });
  }
}

export default new AreaService();