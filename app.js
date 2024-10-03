// กำหนดค่า Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAhpq4LyinAVcxQFDzNHShL-K1Ga9QrGpA",
    authDomain: "homework-management-f90a9.firebaseapp.com",
    databaseURL: "https://homework-management-f90a9-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "homework-management-f90a9",
    storageBucket: "homework-management-f90a9.appspot.com",
    messagingSenderId: "417589049621",
    appId: "1:417589049621:web:36718ee15416779817111c",
    measurementId: "G-9VJ0ELMHJ7"
};

// เริ่มต้นใช้งาน Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// ข้อมูลสต็อก
let furnitureStock = [];
let nextId = 1;

// Function to populate filter dropdowns
function populateFilters() {
    const models = new Set();
    const colors = new Set();
    const types = new Set();

    furnitureStock.forEach(item => {
        models.add(item.model);
        colors.add(item.color);
        types.add(item.type);
    });

    populateDropdown('modelFilter', models, 'เลือกรุ่น');
    populateDropdown('colorFilter', colors, 'เลือกสี');
    populateDropdown('typeFilter', types, 'เลือกประเภท');
    populateDropdown('historyModelFilter', models, 'เลือกรุ่น');
    populateDropdown('historyColorFilter', colors, 'เลือกสี');
    populateDropdown('historyTypeFilter', types, 'เลือกประเภท');
}

function populateDropdown(id, values, defaultLabel) {
    const dropdown = document.getElementById(id);
    dropdown.innerHTML = `<option value="">${defaultLabel}</option>`;
    values.forEach(value => {
        dropdown.innerHTML += `<option value="${value}">${value}</option>`;
    });
}

// ฟังก์ชันแสดงข้อมูลในตาราง
function displayStock() {
    const stockTable = document.getElementById("stockTable");
    stockTable.innerHTML = "";
    
    const searchTerm = document.getElementById("searchInput").value.toLowerCase();
    const modelFilter = document.getElementById("modelFilter").value;
    const colorFilter = document.getElementById("colorFilter").value;
    const typeFilter = document.getElementById("typeFilter").value;

    furnitureStock.forEach(item => {
        if (
            (searchTerm === "" || 
             item.model.toLowerCase().includes(searchTerm) || 
             item.color.toLowerCase().includes(searchTerm) || 
             item.type.toLowerCase().includes(searchTerm)) &&
            (modelFilter === "" || item.model === modelFilter) &&
            (colorFilter === "" || item.color === colorFilter) &&
            (typeFilter === "" || item.type === typeFilter)
        ) {
            const row = `
                <tr class="border-b border-gray-200 hover:bg-gray-100">
                    <td class="py-3 px-4">${item.model}</td>
                    <td class="py-3 px-4">${item.color}</td>
                    <td class="py-3 px-4">${item.quantity}</td>
                    <td class="py-3 px-4">${item.type}</td>
                    <td class="py-3 px-4">
                        <button onclick="showSendForm('${item.id}')" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mr-2 mb-2 md:mb-0">
                            <i class="fas fa-paper-plane mr-2"></i>ส่งของ
                        </button>
                        <button onclick="showEditForm('${item.id}')" class="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded mr-2">
                            <i class="fas fa-edit mr-2"></i>แก้ไข
                        </button>
                        <button onclick="deleteStock('${item.id}')" class="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded">
                            <i class="fas fa-trash-alt mr-2"></i>ลบ
                        </button>
                    </td>
                </tr>
            `;
            stockTable.innerHTML += row;
        }
    });
}

function deleteStock(id) {
    database.ref('furniture/' + id).remove()
        .then(() => {
            addNotification('ลบรายการสำเร็จ', 'success');
            displayStock();
        })
        .catch(error => {
            console.error("Error removing document: ", error);
            addNotification('เกิดข้อผิดพลาดในการลบรายการ', 'error');
        });
}


// ฟังก์ชันแสดงฟอร์มเพิ่มสต็อก
function showAddForm() {
    document.getElementById("addStockForm").classList.remove("hidden");
}

// ฟังก์ชันซ่อนฟอร์มเพิ่มสต็อก
function hideAddForm() {
    document.getElementById("addStockForm").classList.add("hidden");
}

// ฟังก์ชันเพิ่มสต็อกใหม่
document.getElementById("addForm").addEventListener("submit", function(e) {
    e.preventDefault();
    
    const model = document.getElementById("model").value;
    const color = document.getElementById("color").value;
    const type = document.getElementById("type").value;
    const addQuantity = parseInt(document.getElementById("addQuantity").value);
    
    let existingItem = furnitureStock.find(item => 
        item.model === model && item.color === color && item.type === type
    );

    if (existingItem) {
        // Update the quantity of the existing item
        const updatedQuantity = existingItem.quantity + addQuantity;
        database.ref('furniture/' + existingItem.id).update({ quantity: updatedQuantity });
    } else {
        // Add a new item if not found
        const newItem = {
            id: nextId++,
            model: model,
            color: color,
            quantity: addQuantity,
            type: type,
            history: []
        };
        database.ref('furniture').push(newItem);
    }

    hideAddForm();
    document.getElementById("addForm").reset();
});

// ฟังก์ชันแสดงฟอร์มส่งของ
function showSendForm(id) {
    document.getElementById("sendStockForm").classList.remove("hidden");
    document.getElementById("sendItemId").value = id;
}

// ฟังก์ชันซ่อนฟอร์มส่งของ
function hideSendForm() {
    document.getElementById("sendStockForm").classList.add("hidden");
}

// ฟังก์ชันส่งของ
document.getElementById("sendForm").addEventListener("submit", function(e) {
    e.preventDefault();
    const id = document.getElementById("sendItemId").value;
    const quantity = parseInt(document.getElementById("sendQuantity").value);
    const destination = document.getElementById("sendDestination").value;
    const recipient = document.getElementById("sendRecipient").value;
    const phone = document.getElementById("sendPhone").value;
    const details = document.getElementById("sendDetails").value;

    // อัปเดตข้อมูลใน Firebase
    const itemRef = database.ref('furniture/' + id);
    itemRef.once('value', snapshot => {
        const item = snapshot.val();
        if (item && item.quantity >= quantity) {
            const updatedQuantity = item.quantity - quantity;
            const newHistory = {
                date: new Date().toLocaleString(),
                action: "ส่งของ",
                quantity: quantity,
                destination: destination,
                recipient: recipient,
                phone: phone,
                details: details
            };

            const updates = {
                quantity: updatedQuantity,
                history: item.history ? [...item.history, newHistory] : [newHistory]
            };

            itemRef.update(updates)
                .then(() => {
                    alert(`ส่งของสำเร็จ\nส่งไปที่: ${destination}\nผู้รับ: ${recipient}\nเบอร์โทร: ${phone}\nรายละเอียด: ${details}`);
                    hideSendForm();
                    document.getElementById("sendForm").reset();
                })
                .catch(error => {
                    console.error("Error updating document: ", error);
                    alert("เกิดข้อผิดพลาดในการอัปเดตข้อมูล กรุณาลองใหม่อีกครั้ง");
                });
        } else {
            alert("ไม่สามารถส่งของได้ เนื่องจากจำนวนไม่เพียงพอ");
        }
    });
});

// ฟังก์ชันแสดงฟอร์มแก้ไขสต็อก
function showEditForm(id) {
    document.getElementById("editStockForm").classList.remove("hidden");
    document.getElementById("editItemId").value = id;

    const item = furnitureStock.find(item => item.id === id);
    if (item) {
        document.getElementById("editModel").value = item.model;
        document.getElementById("editColor").value = item.color;
        document.getElementById("editQuantity").value = item.quantity;
        document.getElementById("editType").value = item.type;
    }
}

// ฟังก์ชันซ่อนฟอร์มแก้ไขสต็อก
function hideEditForm() {
    document.getElementById("editStockForm").classList.add("hidden");
}

// ฟังก์ชันแก้ไขสต็อก
document.getElementById("editForm").addEventListener("submit", function(e) {
    e.preventDefault();
    const id = document.getElementById("editItemId").value;
    const model = document.getElementById("editModel").value;
    const color = document.getElementById("editColor").value;
    const quantity = parseInt(document.getElementById("editQuantity").value);
    const type = document.getElementById("editType").value;

    // อัปเดตข้อมูลใน Firebase
    const itemRef = database.ref('furniture/' + id);
    itemRef.update({
        model: model,
        color: color,
        quantity: quantity,
        type: type
    })
    .then(() => {
        alert("แก้ไขสต็อกสำเร็จ");
        hideEditForm();
        document.getElementById("editForm").reset();
    })
    .catch(error => {
        console.error("Error updating document: ", error);
        alert("เกิดข้อผิดพลาดในการอัปเดตข้อมูล กรุณาลองใหม่อีกครั้ง");
    });
});

// ฟังก์ชันแสดงประวัติทั้งหมด
function showAllHistory() {
    const allHistoryContent = document.getElementById("allHistoryContent");
    allHistoryContent.innerHTML = "";
    
    const searchTerm = document.getElementById("historySearchInput").value.toLowerCase();
    const modelFilter = document.getElementById("historyModelFilter").value;
    const colorFilter = document.getElementById("historyColorFilter").value;
    const typeFilter = document.getElementById("historyTypeFilter").value;

    database.ref('furniture').once('value', snapshot => {
        snapshot.forEach(childSnapshot => {
            const item = childSnapshot.val();
            if (
                (modelFilter === "" || item.model === modelFilter) &&
                (colorFilter === "" || item.color === colorFilter) &&
                (typeFilter === "" || item.type === typeFilter) &&
                item.history && item.history.length > 0
            ) {
                const filteredHistory = item.history.filter(record =>
                    record.date.toLowerCase().includes(searchTerm) ||
                    record.action.toLowerCase().includes(searchTerm) ||
                    (record.destination && record.destination.toLowerCase().includes(searchTerm)) ||
                    (record.recipient && record.recipient.toLowerCase().includes(searchTerm)) ||
                    (record.phone && record.phone.toLowerCase().includes(searchTerm)) ||
                    (record.details && record.details.toLowerCase().includes(searchTerm))
                );

                if (filteredHistory.length > 0) {
                    const itemHistory = `
                        <div class="bg-gray-100 p-4 rounded-lg mb-4">
                            <h3 class="text-xl font-bold mb-2">${item.model} (${item.color})</h3>
                            ${filteredHistory.map((record, index) => `
                                <div class="bg-white p-2 rounded mb-2">
                                    <p class="font-bold">รายการที่ ${index + 1}</p>
                                    <p>วันที่: ${record.date}</p>
                                    <p>การกระทำ: ${record.action}</p>
                                    <p>จำนวน: ${record.quantity}</p>
                                    ${record.action === "ส่งของ" ? `
                                        <p>ส่งไปที่: ${record.destination}</p>
                                        <p>ผู้รับ: ${record.recipient}</p>
                                        <p>เบอร์โทร: ${record.phone}</p>
                                        <p>รายละเอียด: ${record.details}</p>
                                    ` : ''}
                                    <button onclick="deleteHistory('${childSnapshot.key}', ${index})" class="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-2 rounded mt-2">
                                        <i class="fas fa-trash-alt mr-2"></i>ลบประวัติ
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    `;
                    allHistoryContent.innerHTML += itemHistory;
                }
            }
        });
    });
    
    document.getElementById("allHistoryForm").classList.remove("hidden");
}


// Add this function to delete history items
function deleteHistory(itemId, historyIndex) {
    const itemRef = database.ref('furniture/' + itemId);
    itemRef.once('value', snapshot => {
        const item = snapshot.val();
        if (item && item.history) {
            item.history.splice(historyIndex, 1);
            itemRef.update({ history: item.history })
                .then(() => {
                    addNotification('ลบประวัติสำเร็จ', 'success');
                    showAllHistory();
                })
                .catch(error => {
                    console.error("Error removing history: ", error);
                    addNotification('เกิดข้อผิดพลาดในการลบประวัติ', 'error');
                });
        }
    });
}


// ฟังก์ชันซ่อนฟอร์มประวัติทั้งหมด
function hideAllHistoryForm() {
    document.getElementById("allHistoryForm").classList.add("hidden");
}

// Update event listeners for search and filters
document.getElementById("searchInput").addEventListener("input", displayStock);
document.getElementById("modelFilter").addEventListener("change", displayStock);
document.getElementById("colorFilter").addEventListener("change", displayStock);
document.getElementById("typeFilter").addEventListener("change", displayStock);

// Update event listeners for history search and filters
document.getElementById("historySearchInput").addEventListener("input", showAllHistory);
document.getElementById("historyModelFilter").addEventListener("change", showAllHistory);
document.getElementById("historyColorFilter").addEventListener("change", showAllHistory);
document.getElementById("historyTypeFilter").addEventListener("change", showAllHistory);

database.ref('furniture').on('value', snapshot => {
    furnitureStock = [];
    snapshot.forEach(childSnapshot => {
        const item = childSnapshot.val();
        item.id = childSnapshot.key;
        furnitureStock.push(item);
    });
    displayStock();
    populateFilters();
});

// Initial display
displayStock();
populateFilters();