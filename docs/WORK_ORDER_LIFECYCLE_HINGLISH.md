# Work Order Lifecycle Guide (Hinglish)

Is document mein Work Order (WO) ke poore jeevan-chakra (cycle) aur rules ke baare mein bataya gaya hai. Humara naya system ek **Strict State Machine** follow karta hai taaki har kaam ki sahi tracking aur validation ho sake.

## 1. Status Sequence (Kaise badhta hai WO)

Work Order niche diye gaye logic ke hisaab se hi aage badh sakta hai:

### **Phase 1: Creation & Assignment**
*   **New**: Jab koi request aati hai, wo `New` status mein hoti hai. Is stage par koi assignee nahi hota.
*   **Open**: Jab Manager kisi Technician ko WO assign karta hai, wo automatically `Open` ho jata hai. Bina assignment ke WO aage nahi badh sakta.

### **Phase 2: Execution (Kaam Shuru)**
*   **In Progress**: Technician site par pahunch kar "Start Work" dabata hai. Isse system mein kaam shuru hone ka exact time record ho jata hai. 

### **Phase 3: Quality Check (Review)**
*   **Pending Review**: **Sabse bada badlav!** Technician ab direct kaam ko "Complete" nahi kar sakta. Kaam khatam hone par use "Submit for Review" karna hoga.
    *   **Resolution Notes**: Technician ko batana hoga ki usne kya kaam kiya (Mandatory).
    *   **Images**: Agar kaam 'High' ya 'Critical' priority ka hai, toh proof ke liye kam-se-kam 1 photo upload karni hi hogi.

### **Phase 4: Manager Approval**
*   Manager list mein "Pending Review" wale orders dekhta hai aur do options chun sakta hai:
    1.  **Approve & Complete**: Agar kaam sahi hai, toh Manager use finalize kar deta hai. Ab status `Completed` ho jayega.
    2.  **Reject & Send Back**: Agar kaam adhoora hai, toh Manager rejection reason likhkar use wapas `In Progress` mein bhej deta hai taaki technician use theek kare.

## 2. Important Rules System Mein

1.  **Sequence Lock**: Aap statuses ko jump nahi kar sakte (e.g., direct New se Completed nahi ho sakta).
2.  **Manager Only Power**: Sirf Org Admin ya Manager hi kisi kaam ko `Completed` mark kar sakte hain Review phase ke baad. 
3.  **Audit Trail**: Har status change ke saath system record karta hai ki kisne, kab, aur kya note likhkar status badla. Isse baad mein accountability bani rehti hai.

## 3. Quick Reference Table

| Current Status | Next Allowed Status | Kaun Kar Sakta Hai? | Note |
| :--- | :--- | :--- | :--- |
| **New** | Open / Cancelled | Manager | Assignment par auto-Open |
| **Open** | In Progress | Technician / Manager | Kaam shuru karne par |
| **In Progress**| Pending Review| Technician / Manager | Resolution Notes & Image zaroori |
| **Pending Review**| Completed (Approve)| Manager | Validation ke baad |
| **Pending Review**| In Progress (Reject)| Manager | Rejection reason ke saath |

Is system se hamara maintenance process aur bhi professional aur error-free ho jata hai.
