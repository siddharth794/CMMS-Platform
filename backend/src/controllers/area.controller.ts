import { Request, Response, NextFunction } from 'express';
import areaService from '../services/area.service';

export const getFloors = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const siteId = req.params.siteId as string;
    const orgId = req.user!.org_id;
    const floors = await areaService.getFloors(siteId, orgId);
    res.json({ data: floors });
  } catch (error) {
    next(error);
  }
};

export const createFloor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.user!.org_id;
    const floor = await areaService.createFloor(orgId, req.body);
    res.status(201).json({ message: 'Floor created successfully', data: floor });
  } catch (error) {
    next(error);
  }
};

export const updateFloor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.user!.org_id;
    const floor = await areaService.updateFloor(req.params.id as string, orgId, req.body);
    res.json({ message: 'Floor updated successfully', data: floor });
  } catch (error) {
    next(error);
  }
};

export const deleteFloor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.user!.org_id;
    await areaService.deleteFloor(req.params.id as string, orgId);
    res.json({ message: 'Floor deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getAreas = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const floorId = req.params.floorId as string;
    const orgId = req.user!.org_id;
    const areas = await areaService.getAreas(floorId, orgId);
    res.json({ data: areas });
  } catch (error) {
    next(error);
  }
};

export const getAreaById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.user!.org_id;
    const area = await areaService.getAreaById(req.params.id as string, orgId);
    res.json({ data: area });
  } catch (error) {
    next(error);
  }
};

export const createArea = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.user!.org_id;
    const area = await areaService.createArea(orgId, req.body);
    res.status(201).json({ message: 'Area created successfully', data: area });
  } catch (error) {
    next(error);
  }
};

export const updateArea = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.user!.org_id;
    const area = await areaService.updateArea(req.params.id as string, orgId, req.body);
    res.json({ message: 'Area updated successfully', data: area });
  } catch (error) {
    next(error);
  }
};

export const deleteArea = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.user!.org_id;
    await areaService.deleteArea(req.params.id as string, orgId);
    res.json({ message: 'Area deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getAreaQrCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.user!.org_id;
    const qrData = await areaService.generateAreaQrCode(req.params.id as string, orgId);
    res.json({ data: qrData });
  } catch (error) {
    next(error);
  }
};

export const getSchedules = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.user!.org_id;
    const schedules = await areaService.getSchedules(req.params.areaId as string, orgId);
    res.json({ data: schedules });
  } catch (error) {
    next(error);
  }
};

export const createSchedule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.user!.org_id;
    const schedule = await areaService.createSchedule(req.params.areaId as string, orgId, req.body);
    res.status(201).json({ message: 'Schedule created successfully', data: schedule });
  } catch (error) {
    next(error);
  }
};

export const updateSchedule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.user!.org_id;
    const schedule = await areaService.updateSchedule(req.params.id as string, orgId, req.body);
    res.json({ message: 'Schedule updated successfully', data: schedule });
  } catch (error) {
    next(error);
  }
};

export const deleteSchedule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.user!.org_id;
    await areaService.deleteSchedule(req.params.id as string, orgId);
    res.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getExecutions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.user!.org_id;
    const filters = req.query; // e.g., ?status=PENDING
    const executions = await areaService.getExecutions(orgId, filters);
    res.json({ data: executions });
  } catch (error) {
    next(error);
  }
};

export const verifyQr = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.user!.org_id;
    const userId = req.user!.id;
    const execution = await areaService.verifyQrAndStartTask(req.params.id as string, req.body.qr_code_hash, orgId, userId);
    res.json({ message: 'QR Verified. Task Started.', data: execution });
  } catch (error) {
    next(error);
  }
};

export const completeTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.user!.org_id;
    const userId = req.user!.id;
    const execution = await areaService.completeTask(req.params.id as string, orgId, userId);
    res.json({ message: 'Task Completed.', data: execution });
  } catch (error) {
    next(error);
  }
};