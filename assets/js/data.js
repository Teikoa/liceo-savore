/* =====================================================================
   LICEO SAVORE - Sample data
   Liceo de Cagayan University - Senior High School Department

   This is a front-end prototype. Everything the pages display comes from
   this file plus whatever the visitor does during the demo (kept in
   localStorage). There is no server and no database.
   ===================================================================== */

/* ------------------------------------------------------------ the menu */

const MENU = [
    { id: 1,  name: 'Chicken Adobo Rice',  desc: 'Classic adobo with steamed rice and egg',     price: 65, category: 'Rice Meals', icon: '🍚', available: true,  stock: 40 },
    { id: 2,  name: 'Pork Sinigang Meal',  desc: 'Sour tamarind soup with rice',                price: 70, category: 'Rice Meals', icon: '🍲', available: true,  stock: 30 },
    { id: 3,  name: 'Beef Tapa Silog',     desc: 'Cured beef, garlic rice, and fried egg',      price: 75, category: 'Rice Meals', icon: '🥩', available: true,  stock: 25 },
    { id: 4,  name: 'Chicken Curry Rice',  desc: 'Mild curry with potatoes and carrots',        price: 68, category: 'Rice Meals', icon: '🍛', available: false, stock: 0  },
    { id: 5,  name: 'Pancit Canton',       desc: 'Stir-fried noodles with vegetables',          price: 45, category: 'Snacks',     icon: '🍜', available: true,  stock: 40 },
    { id: 6,  name: 'Clubhouse Sandwich',  desc: 'Ham, cheese, egg, and lettuce on toast',      price: 50, category: 'Snacks',     icon: '🥪', available: true,  stock: 35 },
    { id: 7,  name: 'Cheese Burger',       desc: 'Quarter patty with cheese and house sauce',   price: 55, category: 'Snacks',     icon: '🍔', available: true,  stock: 35 },
    { id: 8,  name: 'Lumpiang Shanghai',   desc: 'Six pieces with sweet chili dip',             price: 40, category: 'Snacks',     icon: '🥟', available: true,  stock: 45 },
    { id: 9,  name: 'Iced Tea 16oz',       desc: 'House-brewed lemon iced tea',                 price: 25, category: 'Drinks',     icon: '🧋', available: true,  stock: 60 },
    { id: 10, name: 'Bottled Water',       desc: '500ml purified water',                        price: 20, category: 'Drinks',     icon: '💧', available: true,  stock: 80 },
    { id: 11, name: 'Hot Coffee',          desc: 'Brewed barako coffee',                        price: 30, category: 'Drinks',     icon: '☕', available: true,  stock: 50 },
    { id: 12, name: 'Fresh Buko Juice',    desc: 'Chilled coconut juice',                       price: 35, category: 'Drinks',     icon: '🥥', available: false, stock: 0  },
    { id: 13, name: 'Leche Flan Slice',    desc: 'Creamy caramel custard',                      price: 35, category: 'Desserts',   icon: '🍮', available: true,  stock: 25 },
    { id: 14, name: 'Banana Turon',        desc: 'Two pieces of caramelised banana rolls',      price: 25, category: 'Desserts',   icon: '🍌', available: true,  stock: 40 }
];

const CATEGORIES = ['All', 'Rice Meals', 'Snacks', 'Drinks', 'Desserts'];

/* --------------------------------- the three break windows (Fig. 5.1) */

const PICKUP_SESSIONS = [
    { id: 1, name: 'Morning Snack',   start: '08:50', end: '09:10' },
    { id: 2, name: 'Lunch',           start: '11:50', end: '13:00' },
    { id: 3, name: 'Afternoon Snack', start: '14:00', end: '14:20' }
];

/* ------------------------------------------------- the demo user */

const CURRENT_STUDENT = {
    name: 'Princy Laiza Mocorro',
    initials: 'PM',
    studentNumber: '2026-00123',
    strand: 'TVL-ICT',
    section: 'ICT 1',
    email: 'mocorro.student@liceo.edu.ph'
};

const CURRENT_STAFF = {
    name: 'Maria Santos',
    initials: 'MS',
    position: 'Canteen Staff'
};

/* ----------------------------------------- policy (Sec. 1.6 Scope) */

const POLICY = {
    noShowLimit: 3,        // no-shows allowed inside the window
    windowDays: 30,        // rolling window
    suspensionDays: 7,     // automatic suspension length
    cutoffMinutes: 20      // ordering closes this long before a window
};

/* -------------------------------------------- the student's history */

const SAMPLE_ORDERS = [
    {
        code: 'LS-260919-4471', placedAt: '2026-09-19 07:42', pickupDate: '2026-09-19',
        session: 'Lunch', method: 'GCash', paymentStatus: 'Verified',
        status: 'Completed', total: 115,
        items: [ { name: 'Chicken Adobo Rice', qty: 1, price: 65 }, { name: 'Pancit Canton', qty: 1, price: 45 }, { name: 'Bottled Water', qty: 0, price: 0 } ]
    },
    {
        code: 'LS-260918-2210', placedAt: '2026-09-18 08:05', pickupDate: '2026-09-18',
        session: 'Morning Snack', method: 'Cash on Pickup', paymentStatus: 'Verified',
        status: 'Completed', total: 75,
        items: [ { name: 'Clubhouse Sandwich', qty: 1, price: 50 }, { name: 'Iced Tea 16oz', qty: 1, price: 25 } ]
    },
    {
        code: 'LS-260917-8890', placedAt: '2026-09-17 09:30', pickupDate: '2026-09-17',
        session: 'Afternoon Snack', method: 'Cash on Pickup', paymentStatus: 'Unpaid',
        status: 'No-Show', total: 65,
        items: [ { name: 'Lumpiang Shanghai', qty: 1, price: 40 }, { name: 'Iced Tea 16oz', qty: 1, price: 25 } ]
    },
    {
        code: 'LS-260915-1123', placedAt: '2026-09-15 07:15', pickupDate: '2026-09-15',
        session: 'Lunch', method: 'Maya', paymentStatus: 'Verified',
        status: 'Completed', total: 140,
        items: [ { name: 'Beef Tapa Silog', qty: 1, price: 75 }, { name: 'Cheese Burger', qty: 1, price: 55 }, { name: 'Hot Coffee', qty: 0, price: 0 } ]
    },
    {
        code: 'LS-260912-5567', placedAt: '2026-09-12 10:02', pickupDate: '2026-09-12',
        session: 'Afternoon Snack', method: 'Cash on Pickup', paymentStatus: 'Unpaid',
        status: 'Cancelled', total: 45,
        items: [ { name: 'Pancit Canton', qty: 1, price: 45 } ]
    }
];

/* The student's own no-show record (Sec. 1.6) */
const SAMPLE_NOSHOWS = [
    { date: '2026-09-17 14:35', code: 'LS-260917-8890', value: 65,
      remarks: 'Order not claimed within the selected pickup schedule.' }
];

/* -------------------------------------------------- notifications */

const SAMPLE_NOTIFICATIONS = [
    { type: 'warning', date: '2026-09-17 14:35', code: 'LS-260917-8890',
      message: 'Order LS-260917-8890 was not claimed and is recorded as a no-show. 2 more within 30 days will suspend pre-ordering.' },
    { type: 'success', date: '2026-09-19 12:05', code: 'LS-260919-4471',
      message: 'Order LS-260919-4471 is ready at the express counter.' },
    { type: 'success', date: '2026-09-19 07:51', code: 'LS-260919-4471',
      message: 'Your payment for LS-260919-4471 was verified. The order is confirmed.' },
    { type: 'info', date: '2026-09-18 08:06', code: 'LS-260918-2210',
      message: 'Order LS-260918-2210 confirmed for Morning Snack.' }
];

/* ============================================================ ADMIN */

/* Live orders on the canteen console board */
const ADMIN_ORDERS = [
    { code: 'LS-260922-1002', student: 'Jeff Brian Dado',    section: 'STEM 3', studentNo: '2026-00124',
      session: 'Lunch', method: 'GCash', paymentStatus: 'Awaiting Verification',
      status: 'Pending', total: 115, lines: 2, reference: '0123 4567 89012',
      items: [ { name: 'Chicken Adobo Rice', qty: 1, price: 65 }, { name: 'Pancit Canton', qty: 1, price: 45 } ] },

    { code: 'LS-260922-1007', student: 'Althea Nessy Responso', section: 'HUMSS 2', studentNo: '2026-00131',
      session: 'Lunch', method: 'Maya', paymentStatus: 'Awaiting Verification',
      status: 'Pending', total: 75, lines: 1, reference: '9981 2234 55110',
      items: [ { name: 'Beef Tapa Silog', qty: 1, price: 75 } ] },

    { code: 'LS-260922-1011', student: 'Christian Rhey Gualiza', section: 'ABM 1', studentNo: '2026-00145',
      session: 'Morning Snack', method: 'Cash on Pickup', paymentStatus: 'Unpaid',
      status: 'Confirmed', total: 95, lines: 2,
      items: [ { name: 'Cheese Burger', qty: 1, price: 55 }, { name: 'Pancit Canton', qty: 0, price: 40 } ] },

    { code: 'LS-260922-1014', student: 'Jandy Velez', section: 'ICT 1', studentNo: '2026-00152',
      session: 'Lunch', method: 'Cash on Pickup', paymentStatus: 'Unpaid',
      status: 'Confirmed', total: 70, lines: 1,
      items: [ { name: 'Pork Sinigang Meal', qty: 1, price: 70 } ] },

    { code: 'LS-260922-1019', student: 'Mark Clarence Ralloma', section: 'STEM 1', studentNo: '2026-00160',
      session: 'Lunch', method: 'GCash', paymentStatus: 'Verified',
      status: 'Preparing', total: 100, lines: 2,
      items: [ { name: 'Clubhouse Sandwich', qty: 1, price: 50 }, { name: 'Cheese Burger', qty: 0, price: 50 } ] },

    { code: 'LS-260922-1023', student: 'Dennis Caingin', section: 'TVL-HE 2', studentNo: '2026-00166',
      session: 'Morning Snack', method: 'Cash on Pickup', paymentStatus: 'Unpaid',
      status: 'Ready for Pickup', total: 65, lines: 2,
      items: [ { name: 'Lumpiang Shanghai', qty: 1, price: 40 }, { name: 'Iced Tea 16oz', qty: 1, price: 25 } ] },

    { code: 'LS-260922-1028', student: 'Ken Loquias', section: 'ICT 2', studentNo: '2026-00171',
      session: 'Afternoon Snack', method: 'Maya', paymentStatus: 'Verified',
      status: 'Ready for Pickup', total: 60, lines: 2,
      items: [ { name: 'Banana Turon', qty: 1, price: 25 }, { name: 'Leche Flan Slice', qty: 1, price: 35 } ] }
];

/* Orders already closed out today */
const ADMIN_CLOSED = [
    { code: 'LS-260922-0914', student: 'Rogel Acido',     section: 'STEM 2', session: 'Morning Snack', method: 'Cash on Pickup', status: 'Completed', total: 90 },
    { code: 'LS-260922-0921', student: 'Mary Grace Albiso', section: 'ICT 1', session: 'Morning Snack', method: 'GCash',         status: 'Completed', total: 125 },
    { code: 'LS-260922-0933', student: 'John Dave Jumahali', section: 'ABM 2', session: 'Morning Snack', method: 'Cash on Pickup', status: 'No-Show',  total: 45 },
    { code: 'LS-260922-0940', student: 'Aaron Khalil Mesias', section: 'ICT 1', session: 'Morning Snack', method: 'Maya',         status: 'Cancelled', total: 70 }
];

/* Receipts waiting for manual checking (Sec. 1.6, Limitation 1) */
const PAYMENT_QUEUE = [
    { code: 'LS-260922-1002', student: 'Jeff Brian Dado', studentNo: '2026-00124', section: 'STEM 3',
      method: 'GCash', reference: '0123 4567 89012', total: 115, declared: 115,
      submitted: '2026-09-22 07:18', session: 'Lunch', pickupDate: 'Today' },

    { code: 'LS-260922-1007', student: 'Althea Nessy Responso', studentNo: '2026-00131', section: 'HUMSS 2',
      method: 'Maya', reference: '9981 2234 55110', total: 75, declared: 70,
      submitted: '2026-09-22 07:44', session: 'Lunch', pickupDate: 'Today' }
];

const PAYMENT_VERIFIED = [
    { code: 'LS-260922-1019', student: 'Mark Clarence Ralloma', studentNo: '2026-00160', section: 'STEM 1',
      method: 'GCash', reference: '5540 1122 88743', total: 100, declared: 100,
      submitted: '2026-09-22 06:55', reviewed: '2026-09-22 07:10', reviewer: 'Maria Santos',
      session: 'Lunch', pickupDate: 'Today' },
    { code: 'LS-260922-0921', student: 'Mary Grace Albiso', studentNo: '2026-00180', section: 'ICT 1',
      method: 'GCash', reference: '7781 0093 22415', total: 125, declared: 125,
      submitted: '2026-09-22 06:31', reviewed: '2026-09-22 06:40', reviewer: 'Maria Santos',
      session: 'Morning Snack', pickupDate: 'Today' }
];

const PAYMENT_REJECTED = [
    { code: 'LS-260922-0940', student: 'Aaron Khalil Mesias', studentNo: '2026-00190', section: 'ICT 1',
      method: 'Maya', reference: '2213 6654 00918', total: 70, declared: 50,
      submitted: '2026-09-22 06:12', reviewed: '2026-09-22 06:20', reviewer: 'Maria Santos',
      reason: 'Amount sent does not match the order total.',
      session: 'Morning Snack', pickupDate: 'Today' }
];

/* Orders whose window closed without being claimed */
const NOSHOW_PENDING = [
    { code: 'LS-260922-0933', student: 'John Dave Jumahali', studentNo: '2026-00201', section: 'ABM 2',
      session: 'Morning Snack', endedAt: '9:10 AM', pickupDate: 'Today',
      method: 'Cash on Pickup', status: 'Ready for Pickup', total: 45 },
    { code: 'LS-260921-0788', student: 'Princy Laiza Mocorro', studentNo: '2026-00123', section: 'ICT 1',
      session: 'Afternoon Snack', endedAt: '2:20 PM', pickupDate: 'Sep 21',
      method: 'Cash on Pickup', status: 'Ready for Pickup', total: 60 }
];

/* Running no-show record per student, inside the 30-day window */
const NOSHOW_STUDENTS = [
    { name: 'John Dave Jumahali', studentNo: '2026-00201', strand: 'ABM',     section: 'ABM 2',
      count: 3, last: '2026-09-22 09:15', value: 175, suspendedUntil: '2026-09-29' },
    { name: 'Ken Loquias',        studentNo: '2026-00171', strand: 'TVL-ICT', section: 'ICT 2',
      count: 2, last: '2026-09-20 13:05', value: 110, suspendedUntil: null },
    { name: 'Princy Laiza Mocorro', studentNo: '2026-00123', strand: 'TVL-ICT', section: 'ICT 1',
      count: 1, last: '2026-09-17 14:35', value: 65, suspendedUntil: null },
    { name: 'Dennis Caingin',     studentNo: '2026-00166', strand: 'TVL-HE',  section: 'TVL-HE 2',
      count: 1, last: '2026-09-12 09:20', value: 50, suspendedUntil: null }
];

/* ------------------------------------------------------- reporting */

const REPORT_DAYS = [
    { date: '2026-09-22', label: 'Mon, Sep 22', orders: 28, noshows: 2, revenue: 1985 },
    { date: '2026-09-19', label: 'Fri, Sep 19', orders: 34, noshows: 1, revenue: 2410 },
    { date: '2026-09-18', label: 'Thu, Sep 18', orders: 31, noshows: 3, revenue: 2075 },
    { date: '2026-09-17', label: 'Wed, Sep 17', orders: 26, noshows: 2, revenue: 1790 },
    { date: '2026-09-16', label: 'Tue, Sep 16', orders: 29, noshows: 0, revenue: 2130 },
    { date: '2026-09-15', label: 'Mon, Sep 15', orders: 33, noshows: 2, revenue: 2295 }
];

const REPORT_BESTSELLERS = [
    { name: 'Chicken Adobo Rice', category: 'Rice Meals', pieces: 48, revenue: 3120 },
    { name: 'Clubhouse Sandwich', category: 'Snacks',     pieces: 41, revenue: 2050 },
    { name: 'Iced Tea 16oz',      category: 'Drinks',     pieces: 39, revenue: 975  },
    { name: 'Cheese Burger',      category: 'Snacks',     pieces: 34, revenue: 1870 },
    { name: 'Pancit Canton',      category: 'Snacks',     pieces: 30, revenue: 1350 },
    { name: 'Beef Tapa Silog',    category: 'Rice Meals', pieces: 27, revenue: 2025 },
    { name: 'Banana Turon',       category: 'Desserts',   pieces: 22, revenue: 550  },
    { name: 'Bottled Water',      category: 'Drinks',     pieces: 19, revenue: 380  }
];

const REPORT_METHODS = [
    { method: 'Cash on Pickup', orders: 98, revenue: 6840 },
    { method: 'GCash',          orders: 52, revenue: 4115 },
    { method: 'Maya',           orders: 23, revenue: 1730 }
];

const REPORT_SESSIONS = [
    { name: 'Morning Snack',   start: '8:50 AM',  orders: 61, noshows: 4, revenue: 3240 },
    { name: 'Lunch',           start: '11:50 AM', orders: 84, noshows: 5, revenue: 7105 },
    { name: 'Afternoon Snack', start: '2:00 PM',  orders: 28, noshows: 1, revenue: 2340 }
];

/* Today's kitchen prep list on the staff dashboard */
const PREP_LIST = [
    { name: 'Chicken Adobo Rice', category: 'Rice Meals', pieces: 9 },
    { name: 'Clubhouse Sandwich', category: 'Snacks',     pieces: 7 },
    { name: 'Pancit Canton',      category: 'Snacks',     pieces: 6 },
    { name: 'Iced Tea 16oz',      category: 'Drinks',     pieces: 6 },
    { name: 'Cheese Burger',      category: 'Snacks',     pieces: 4 },
    { name: 'Lumpiang Shanghai',  category: 'Snacks',     pieces: 3 }
];

const ACTIVITY_LOG = [
    { who: 'staff', at: '9:42 AM', action: 'Set order LS-260922-1019 to Preparing' },
    { who: 'staff', at: '9:31 AM', action: 'Verified payment for LS-260922-1019' },
    { who: 'admin', at: '9:12 AM', action: 'Sold out Chicken Curry Rice' },
    { who: 'staff', at: '9:05 AM', action: 'Recorded no-show (count 3 in window)' },
    { who: 'staff', at: '8:48 AM', action: 'Set order LS-260922-1023 to Ready for Pickup' },
    { who: 'admin', at: '8:30 AM', action: 'Updated menu item Banana Turon' }
];
