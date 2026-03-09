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

1. **NEW**: Jab koi *Requester* (ya auto PM system) naya WO banata hai, toh wo by default 'new' status mein hota hai aur unassigned hota hai.
2. **OPEN**: Jab koi *Manager* us WO ko kisi *Technician* ko assign kar deta hai, toh status manually ya automatically 'open' ho jata hai.
3. **IN_PROGRESS**: Jab *Technician* field mein kaam shuru karta hai, wo "Start Work" button pe click karta hai, jisse status 'in_progress' ho jata hai.
4. **ON_HOLD**: Agar parts available nahi hain ya kisi aur wajah se kaam ruk gaya hai.
5. **COMPLETED**: Kaam khatam hone ke baad technician isko 'completed' mark karta hai.
6. **CANCELLED**: Agar kaam ki zaroorat nahi hai, toh manager isko cancel kar sakta hai.

## 3. Role-Based Flow (Kaun kya karta hai?)
Codebase mein `isManager()`, `isRequester()`, aur `isTechnician()` ke base par UI aur API restrictions lagayi gayi hain:

* **Requester**: Sirf problem report kar sakta hai (Create WO). Wo apne banaye hue WOs ka status dekh sakta hai lekin unko delete ya assign nahi kar sakta.
* **Manager / Org Admin**: Pura control hota hai. WO create karna, assign karna, bulk delete karna, aur kisi bhi status mein change karna.
* **Technician**: Apne assigned WOs dekh sakta hai. Status ko 'in_progress' aur 'completed' mein change kar sakta hai. Usme comments daal sakta hai aur parts (inventory) consume kar sakta hai.

## 4. Frontend & Backend APIs
* **Backend**: `workOrder.controller.ts` aur `workOrder.service.ts` mein saare operations (Create, Assign, Update Status, Add Comment, Use Part) likhe gaye hain. API `/api/work-orders` ke under expose hoti hai.
* **Frontend**: 
  * `WorkOrdersPage.tsx`: List view with filters (status, priority), search, aur bulk delete.
  * `WorkOrderDetailPage.tsx`: Detail view jahan actual kaam hota hai (Assign karna, status update karna, comments aur attachments add karna).

## 5. Current System ke Drawbacks
* **Loose Status Transitions**: Abhi system mein koi strict state machine nahi hai. Matlab koi bhi achanak se 'new' se seedha 'completed' par jump kar sakta hai bina 'in_progress' mein jaye.
* **Manual Time Tracking**: `actual_hours` manually enter karna padta hai, koi live timer nahi hai.
* **No Approval Flow**: Technician ke 'completed' mark karte hi WO close ho jata hai. Manager ke review ya approval ki koi intermediate state nahi hai.