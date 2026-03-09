# 🛡️ RBAC (Role-Based Access Control) - Asaan Bhasha Mein (Hinglish Guide)

Yeh document aapko samjhane ke liye banaya gaya hai ki CMMS platform mein **RBAC (Role-Based Access Control)** kaise kaam karta hai. Aasan shabdon mein: **"Kaun sa user kya dekh sakta hai aur kya kar sakta hai, yeh RBAC decide karta hai."**

---

## 1. 🏗️ Main Pillars (Core Entities)

System ko samajhne ke liye in 4 cheezon ko samajhna zaroori hai:

1. **User (Account):** Woh insaan jo login karta hai (e.g., Rahul, Priya). Har user kisi na kisi Organization (`org_id`) ka hissa hota hai.
2. **Access (Choti Permissions):** Yeh sabse choti unit hai. Jaise: `work_order:create`, `asset:delete`. Yeh batati hai ki koi specific action allowed hai ya nahi.
3. **Role (Auhda/Position):** Ek Role bohot saare "Accesses" ka guccha (collection) hota hai. 
   - *Example:* **"Technician"** ek role hai, jiske paas `work_order:view` aur `work_order:update` ka access hoga, par `asset:delete` ka nahi.
   - Roles do type ke hote hain: **System Roles** (jo pehle se bane hain aur change nahi hote, like `super_admin`) aur **Custom Roles** (jo admin khud banata hai).
4. **Group (Team):** Ek group mein bohot saare users aur roles hote hain.
   - *Example:* "Maintenance Team A" ek group hai. Agar hum is group ko "Manager" role de dein, toh is group ke **saare users automatically Manager ban jayenge**.

---

## 2. 🔗 Database Mein Ye Kaise Jude Hain?

Sab kuch ek doosre se aise linked hai:
- **User -> Role:** Ek user ko direct ek role diya ja sakta hai (via `role_id`).
- **Role -> Accesses:** Ek role ke paas multiple accesses hote hain (via `RoleAccess` junction table).
- **Group -> Roles & Users:** Ek group mein multiple roles aur multiple users ho sakte hain. Isse fayda yeh hota hai ki ek-ek user ko role assign karne ki jagah, bas use group mein daal do!

---

## 3. ⚙️ Backend Flow (API Pe Request Aane Ke Baad Kya Hota Hai?)

Jab bhi frontend se koi API call hoti hai, toh backend pe yeh 3 steps hote hain:

### Step 1: `authenticate` Middleware (Token Check)
Jab user JWT token bhejta hai, toh `src/middleware/auth.ts` mein `authenticate` function chalta hai:
1. Woh user ko database se dhoondhta hai.
2. User ke **Direct Roles** aur **Group se mile hue Roles** dono ko combine karta hai. Isko hum **`effectiveRoles`** kehte hain.
3. Phir un sab roles ke andar jitne bhi accesses (permissions) hain, unko combine karke ek **`effectiveAccesses`** ki list banata hai.
4. Yeh dono lists `req.user` object mein save ho jati hain taaki aage ke functions inko use kar sakein.

### Step 2: Route Protection (Raasta Block Karna)
Endpoints ko protect karne ke do tareeqe hain:

1. **`requireRole(['manager', 'admin'])`**: Agar aap chahte ho ki sirf specific "Auhde" wale log API hit kar sakein.
2. **`requirePermission('delete_asset')`**: Yeh zyada strict hai. Yeh check karta hai ki kya user ki `effectiveAccesses` list mein `'delete_asset'` permission hai ya nahi. *(Note: `super_admin` role walon ko yeh permission check bypass karne ki taqat milti hai).*

### Step 3: Service Logic (Data Filter Karna)
Kabhi kabhi API hit toh ho jati hai, par data alag dikhana hota hai.
- Jaise "Get All Work Orders" API. 
- Agar `role === 'technician'` hai, toh backend sirf us technician ko assign kiye hue work orders database se fetch karega.
- Agar `role === 'admin'` hai, toh woh saare work orders fetch karega.
*(Yeh logic `src/services/workOrder.service.ts` mein likha hota hai).*

---

## 4. 💻 Frontend Flow (UI Pe Kaise Kaam Karta Hai?)

Frontend pe humne React Context (`AuthContext.tsx`) banaya hua hai jo user ki details poori app mein share karta hai.

### `AuthContext` ke Helper Functions:
Frontend pe buttons ya pages ko hide/show karne ke liye yeh functions use hote hain:
- `isAdmin()`: Check karta hai ki user `super_admin`, `org_admin`, ya `admin` toh nahi.
- `isManager()`: Check karta hai ki user `manager` ya usse upar ki post ka hai ya nahi.
- `isRequester()`: Check karta hai ki kya user sirf request daal sakta hai.

### Example UI Check (`WorkOrdersPage.tsx`):
Agar humein "Delete" ka button sirf Manager ko dikhana hai, toh hum UI mein aisi condition lagate hain:
```tsx
{isManager() && (
  <Button onClick={() => handleDelete(wo.id)}>
    <Trash2 /> Delete
  </Button>
)}
```

---

## 5. 🚀 Ek Real-World Example (Flow in Action)

Maan lijiye **Rahul** (Technician) ek **Asset delete** karne ki koshish kar raha hai.

1. **Frontend:** `AssetDetailPage.tsx` mein "Delete" button. Agar frontend checks strict hain, toh shayad Rahul ko button dikhega hi nahi. Par maan lo usne API sidha hit kar di.
2. **API Call:** `DELETE /api/assets/123`
3. **Backend Middleware 1 (`authenticate`):** Backend dekhega Rahul ka token. Uske roles nikalega -> `effectiveRoles = ['technician']`. Phir permissions nikalega -> `effectiveAccesses = ['asset:view', 'work_order:update']`.
4. **Backend Middleware 2 (`requirePermission('asset:delete')`):** Route pe yeh check laga hoga. Middleware dekhega ki kya Rahul ke `effectiveAccesses` mein `asset:delete` hai? **Nahi hai!**
5. **Result:** Backend turant `403 Forbidden (Insufficient access)` error return karega.
6. **Frontend Notification:** Rahul ko screen pe lal rang ka error dikhega: *"Failed to delete asset"*.

---

## 🎯 Summary
1. Admin **Roles** banata hai aur unme **Permissions (Accesses)** tick karta hai (`RolesPage.tsx`).
2. Phir Admin users ko seedha Role assign karta hai, ya unhe kisi **Group** mein daal deta hai (`GroupsPage.tsx`).
3. Jab User login karta hai, Backend uske saare roles aur permissions calculate karke memory (`req.user`) mein rakh leta hai.
4. Har API call se pehle Middleware check karta hai ki user ke paas woh kaam karne ka access hai ya nahi.
5. Frontend pe `isManager()` ya `isAdmin()` use karke UI ko clean aur secure rakha jata hai.