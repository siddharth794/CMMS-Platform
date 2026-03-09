# PM Schedules: Kaise Use Karein? (User Guide)

PM Schedules (Preventive Maintenance) ka use karke aap apne assets ke liye recurring maintenance tasks set kar sakte hain. Isse Work Orders automatically generate hote hain.

---

## 1. Naya PM Schedule Kaise Banayein?

1.  **Preventive Maintenance** page par jayein.
2.  **"New Schedule"** button par click karein.
3.  **Title**: Maintenance task ka naam likhein (e.g., "Monthly AC Service").
4.  **Target Asset**: Wo machine ya asset select karein jispe service honi hai.
5.  **Description**: Detailed steps likhein jo technician ko follow karne hain.

---

## 2. Schedule Logic (Fixed vs Floating)

*   **Fixed (Strict Calendar)**: Ye bilkul **Calendar** ki tarah hai. Agar aapne 15th date set ki hai, toh system hamesha 15th ko hi pakadega, chahe pichla kaam kabhi bhi khatam hua ho. (Jaise: Bijli ka bill bharna).
    *   **Date Setting**: "Start Date" field se aap wo date select karein jo har baar repeat hogi.
*   **Floating (From last completion)**: Ye depend karta hai ki pichla kaam **kab khatam** hua. 
    *   **Pehla WO kaise banega?**: Floating mein bhi aapko ek **"First Service Date"** deni hogi. System pehla Work Order usi date par banayega, aur uske baad wale Work Orders floating logic se chalenge.
    *   *Example*: Maan lijiye aapka monthly service 1st March ko due tha (First Service Date), par technician ne usse 10th March ko khatam kiya. 
    *   **Fixed** mein agla WO 1st April ko hi banega.
    *   **Floating** mein agla WO 10th April (10 March + 1 mahina) ko banega.

---

## 3. Frequency aur Priority

*   **Frequency**: Aap Daily, Weekly, Monthly, Quarterly, ya Annual select kar sakte hain.
*   **Start Date ka asar**: Schedule kaise repeat hoga, ye aapki Start Date par depend karta hai:

| Frequency | Kaise kaam karega? | Example |
| :--- | :--- | :--- |
| **Daily** | Har roz trigger hoga. | Date koi bhi ho, WO roz banega. |
| **Weekly** | Start Date ka **Day of the Week** use karega. | Tuesday pick kiya -> Har Tuesday repeat hoga. |
| **Monthly** | Start Date ka **Day of the Month** use karega. | 15th pick kiya -> Har mahine ki 15th ko repeat hoga. |
| **Quarterly** | Har **3 mahine** mein repeat hoga. | 10th Jan pick kiya -> 10th April, 10th July... |
| **Annual** | Saal mein ek baar, usi **Date aur Month** par. | 15th August pick kiya -> Har saal 15th August ko. |

> [!TIP]
> Aap jo **Start Date** select karte hain, wahi aapki recurring **Due Date** ban jati hai.
> Example: Agar aapne Start Date **15th** rakhi hai, toh har mahine ki **15th** hi aapki **Due Date** hogi.
> System **7 days pehle (8th date ko)** Work Order bana dega, par uspar "Due Date" **15th** hi likhi hogi.

*   **Priority**: Work order kitna important hai (Low, Medium, High, Critical).
*   **Estimated Hours**: Is kaam mein kitna time lagega.

---

## 4. Task Checklist (Important!)

Aap **"Add Task Step"** ka use karke technician ke liye step-by-step checklist bana sakte hain:
1. *Check oil levels*
2. *Clean filters*
3. *Grease bearings*

Ye tasks Work Order bante hi wahan automatically show honge.

---

## 5. View aur Edit Kaise Karein?

*   PM Schedules list mein kisi bhi schedule ke **Name** par click karein.
*   Yahan aap details change kar sakte hain.
*   Change karne ke baad **"Save Changes"** button press karein.
*   Agar schedule zaroorat nahi hai, toh **"Delete"** button use karein.

---

### Pro Tip 💡
Hamesha **Floating logic** use karein agar aapka maintenance load zyada hai, taaki tasks ek ke upar ek pile na ho jayein!
