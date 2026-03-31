import { Request, Response, NextFunction } from 'express';
import checklistService from '../services/checklist.service';

export const createChecklist = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const checklist = await checklistService.createChecklist(req.user!.org_id, req.user!.id, req.body);
        res.status(201).json(checklist);
    } catch (error) {
        next(error);
    }
};

export const getChecklists = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const checklists = await checklistService.getChecklists(req.user!.org_id, req.query);
        res.status(200).json(checklists);
    } catch (error) {
        next(error);
    }
};

export const getChecklistById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const checklist = await checklistService.getChecklistById(req.params.id as string, req.user!.org_id);
        res.status(200).json(checklist);
    } catch (error) {
        next(error);
    }
};

export const updateChecklist = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const checklist = await checklistService.updateChecklist(req.params.id as string, req.user!.org_id, req.body);
        res.status(200).json(checklist);
    } catch (error) {
        next(error);
    }
};

export const deleteChecklist = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const force = req.query.force === 'true';
        const result = await checklistService.deleteChecklist(req.params.id as string, req.user!.org_id, force);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

export const restoreChecklist = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await checklistService.restoreChecklist(req.params.id as string, req.user!.org_id);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

export const bulkDeleteChecklists = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { ids, force } = req.body;
        const count = await checklistService.bulkDeleteChecklists(ids, req.user!.org_id, force);
        res.status(200).json({ message: `${count} checklists deleted` });
    } catch (error) {
        next(error);
    }
};

// Item Methods
export const addChecklistItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const checklist = await checklistService.addChecklistItem(req.params.id as string, req.user!.org_id, req.body);
        res.status(201).json(checklist);
    } catch (error) {
        next(error);
    }
};

export const updateChecklistItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const checklist = await checklistService.updateChecklistItem(req.params.id as string, req.params.itemId as string, req.user!.org_id, req.body);
        res.status(200).json(checklist);
    } catch (error) {
        next(error);
    }
};

export const toggleChecklistItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { is_completed } = req.body;
        const checklist = await checklistService.toggleChecklistItem(req.params.id as string, req.params.itemId as string, req.user!.org_id, req.user!.id, is_completed);
        res.status(200).json(checklist);
    } catch (error) {
        next(error);
    }
};

export const deleteChecklistItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await checklistService.deleteChecklistItem(req.params.id as string, req.params.itemId as string, req.user!.org_id);
        res.status(200).json({ message: 'Item deleted successfully' });
    } catch (error) {
        next(error);
    }
};
