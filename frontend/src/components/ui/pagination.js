import React from 'react';
import { Button } from './button';

export const Pagination = ({ currentPage, totalItems, limit = 10, onPageChange }) => {
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const start = (currentPage - 1) * limit + 1;
    const end = Math.min(currentPage * limit, totalItems);

    if (totalItems <= 0) return null;

    return (
        <div className="flex items-center justify-between pt-4 border-t mt-4">
            <p className="text-sm text-muted-foreground">
                Showing <span className="font-medium">{start}</span> to{' '}
                <span className="font-medium">{end}</span> of{' '}
                <span className="font-medium">{totalItems}</span> results
            </p>
            <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                >
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                >
                    Next
                </Button>
            </div>
        </div>
    );
};
