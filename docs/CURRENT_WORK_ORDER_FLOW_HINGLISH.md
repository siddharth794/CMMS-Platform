# Current Work Order (WO) System Architecture & Flow

Yeh document hamare existing CMMS platform mein Work Orders ke flow aur codebase implementation ko samjhata hai.

## 1. Database Structure (Tables & Models)
Abhi ke system mein Work Order ko manage karne ke liye multiple tables aapas mein linked hain:

* **`WorkOrder` Table**: Yeh core table hai jisme main data store hota hai.
  * `wo_number`: Auto-generated unique ID (jaise `WO-20240001`).
  * `title`, `description`: Kaam ka vivaran.
  * `status`: Current state kya hai ('new', 'open', 'in_progress', 'on_hold', 'completed', 'cancelled').
  * `priority`: 'low', 'medium', 'high', 'critical'.
  * Foreign Keys: `asset_id` (kis machine pe kaam hona hai), `requester_id` (kisne request daali), `assignee_id` (kis technician ko assign hua).
  * Time Tracking: `scheduled_start`, `actual_start`, `estimated_hours`, `actual_hours`.

* **Associated Tables**:
  * **`WOComment`**: Users (Technicians, Managers) WO ke andar chat/comments kar sakte hain.
  * **`WOAttachment`**: Images ya PDFs attach karne ke liye.
  * **`WorkOrderInventoryItem`**: Agar WO complete karne mein koi spare parts (Inventory) use hue hain, toh unki quantity yahan track hoti hai.

## 2. Work Order Lifecycle (Statuses)
Ek standard Work Order ka flow in statuses se hokar guzarta hai:

1. **NEW**: Jab koi *Manager* (ya auto PM system) naya WO banata hai, toh wo by default 'new' status mein hota hai aur unassigned hota hai.
2. **OPEN**: Jab koi *Manager* us WO ko kisi *Technician* ko assign kar deta hai, toh status manually ya automatically 'open' ho jata hai.
3. **IN_PROGRESS**: Jab *Technician* field mein kaam shuru karta hai, wo "Start Work" button pe click karta hai, jisse status 'in_progress' ho jata hai.
4. **PENDING_REVIEW**: Kaam khatam hone pe Technician status ko 'pending_review' karta hai "Submit for Review" button ke saath. Isme resolution notes likhna mandatory hai.
5. **COMPLETED**: Manager jab 'pending_review' status ko approve karta hai, tabhi WO 'completed' mark hota hai.
6. **CANCELLED**: Agar kaam ki zaroorat nahi hai, toh manager isko cancel kar sakta hai.

## 3. Role-Based Flow (Kaun kya karta hai?)
Codebase mein `isManager()`, `isRequester()`, aur `isTechnician()` ke base par UI aur API restrictions lagayi gayi hain:

* **Requester**: Inhe koi detail nahi dikhti, sirf dashboard aur assigned list browse kar sakte hain. WOs create karna ya Assets/Inventory ki details dekhna inke liye restricted hai.
* **Manager / Org Admin**: Pura control hota hai. Sirf yahi naye Work Orders, Assets, aur Inventory items create kar sakte hain. Assignment aur approval ka kaam bhi inka hi hai.
* **Technician**: Apne assigned WOs dekh sakta hai. Status ko 'in_progress' aur 'pending_review' mein change kar sakta hai. Assets aur Inventory ki list dekh sakta hai, par details (edit/view details) inke liye restricted hai taaki koi accidentally data update na kar de.

## 4. Frontend & Backend APIs
* **Backend**: `workOrder.controller.ts` aur `workOrder.service.ts` mein saare operations (Create, Assign, Update Status, Add Comment, Use Part) likhe gaye hain. API `/api/work-orders` ke under expose hoti hai.
* **Frontend**: 
  * `WorkOrdersPage.tsx`: List view with filters (status, priority), search, aur bulk delete.
    * `WorkOrderDetailPage.tsx`: Detail view jahan actual kaam hota hai (Assign karna, status update karna, comments aur attachments add karna).

## 5. Current System ke Drawbacks
* **Loose Status Transitions**: Abhi bhi strict state machine par kaam baaki hai, par transition buttons ke through flow control kiya ja raha hai.
* **Manual Time Tracking**: `actual_hours` manually enter karna padta hai, koi live timer nahi hai.
* **Improved Approval Flow**: Ab system mein 'pending_review' state hai, toh bina manager approval ke WO complete nahi hota (Technician cannot direct mark 'completed').