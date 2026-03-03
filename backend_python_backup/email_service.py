import logging
from typing import Optional

logger = logging.getLogger(__name__)

class EmailService:
    """
    Mock email service for notifications.
    In production, replace with actual SMTP/SendGrid implementation.
    """
    
    def __init__(self):
        self.is_enabled = False
        logger.info("Email service initialized (MOCKED)")
    
    async def send_email(
        self,
        to_email: str,
        subject: str,
        body: str,
        html_body: Optional[str] = None
    ) -> bool:
        logger.info(f"[MOCK EMAIL] To: {to_email}, Subject: {subject}")
        logger.info(f"[MOCK EMAIL] Body: {body[:100]}...")
        return True
    
    async def send_work_order_assignment(
        self,
        to_email: str,
        work_order_number: str,
        work_order_title: str,
        assigned_by: str
    ) -> bool:
        subject = f"Work Order Assigned: {work_order_number}"
        body = f"""
        You have been assigned a new work order.
        
        Work Order: {work_order_number}
        Title: {work_order_title}
        Assigned By: {assigned_by}
        
        Please log in to the system to view details.
        """
        return await self.send_email(to_email, subject, body)
    
    async def send_work_order_status_change(
        self,
        to_email: str,
        work_order_number: str,
        work_order_title: str,
        old_status: str,
        new_status: str,
        changed_by: str
    ) -> bool:
        subject = f"Work Order Status Updated: {work_order_number}"
        body = f"""
        A work order status has been updated.
        
        Work Order: {work_order_number}
        Title: {work_order_title}
        Previous Status: {old_status}
        New Status: {new_status}
        Changed By: {changed_by}
        
        Please log in to the system to view details.
        """
        return await self.send_email(to_email, subject, body)
    
    async def send_pm_reminder(
        self,
        to_email: str,
        asset_name: str,
        pm_name: str,
        due_date: str
    ) -> bool:
        subject = f"Preventive Maintenance Due: {pm_name}"
        body = f"""
        A preventive maintenance is due soon.
        
        Asset: {asset_name}
        PM Schedule: {pm_name}
        Due Date: {due_date}
        
        Please schedule this maintenance accordingly.
        """
        return await self.send_email(to_email, subject, body)

email_service = EmailService()
