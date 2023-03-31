

var dataArray = [];

var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction;
window.IDBCursor = window.IDBCursor || window.webkitIDBCursor;
window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange;

const databaseSelect = document.querySelector('#databaseSelect');
(async () => {
  const databases = await indexedDB.databases();
  for (const database of databases) {
    const option = document.createElement('option');
    option.value = database.name;
    option.text = database.name;
    databaseSelect.appendChild(option);
  }
})();

// Listen for the "change" event on the database dropdown
databaseSelect.addEventListener('change', async (event) => {
  const selectedDBName = event.target.value;
  const tableSelect = document.querySelector('#tableSelect');
  // Clear previous options
  tableSelect.innerHTML = '<option value="">Select a table</option>';
  if (selectedDBName) {
    var openReq = indexedDB.open(selectedDBName);
    openReq.onsuccess = function (e) {
        var db = e.target.result;
        var objectStoreNames = db.objectStoreNames;

        for (const objectStoreName of db.objectStoreNames) {
            var option = document.createElement("option");
            option.value = objectStoreName;
            option.text = objectStoreName;
            tableSelect.appendChild(option);
        }
    };
  }
});


function dataRead(databaseName, tableName) {

    indexedDB.open(databaseName, 1).onsuccess = (e)=> {
        var db = e.target.result;

        var tx = db.transaction([tableName], 'readonly');
        var store = tx.objectStore(tableName);
        var req = store.getAll();

        req.onsuccess = function () {
            var data = req.result;
            data.forEach((value, key) => {
                delete value['id'];
                dataArray.push(JSON.stringify(value));
            });
            if (dataArray.length == 0) {
                $('#textArea').val('Empty Database !!!');
            } else {
                $('#textArea').val(`[${dataArray.join(',\n')}]`);
                dataArray = [];
            }
        };
    };
}



function dataUpload(databaseName, tableName) {
    var textData = $('#textArea').val();
    var jsonArray = JSON.parse(textData);

    indexedDB.open(databaseName, 1).onsuccess = (e) => {
        var db = e.target.result;

        var tx = db.transaction([tableName], 'readwrite');
        var store = tx.objectStore(tableName);
        
        jsonArray.forEach(function (data) {
            var req = store.put(data);
            req.onsuccess = function () {
                console.log('data added !');
                $('#textArea').val('data added !');
            };
            req.onerror = function () {
                console.log('error occured !');
            };
        });
    };
}
async function isDatabaseExist(dbName) {
    
    const isExisting = (await indexedDB.databases()).map(db => db.name).includes(dbName);
    return isExisting;
}

$('#btn-data-read').click(async function(){
    var databaseName = $('#databaseSelect').val();
    var tableName = $('#tableSelect').val();

    if (databaseName == '' || tableName == ''){
        $('#textArea').val('Database & Table name is requred to receive data');
    }
    else{
        const dbexists = await isDatabaseExist(databaseName);
        
        if(dbexists == false){
            $('#textArea').val(databaseName +' does not exists in database !');
        }
        else{            
            indexedDB.open(databaseName, 1).onsuccess = (e) => {
                if (e.target.result.objectStoreNames.contains(tableName)) {
                    dataRead(databaseName, tableName);
                }
                else{
                    $('#textArea').val(tableName+' does not exists in table !');
                }
            };
        }
    }
});

$('#btn-data-upload').click(async function(){
    var databaseName = $('#databaseSelect').val();
    var tableName = $('#tableSelect').val();

    if (databaseName == '' || tableName == ''){
        $('#textArea').val('Database & Table name is requred to upload data');
    }
    else{
        const dbexists = await isDatabaseExist(databaseName);
        
        if(dbexists == false){
            $('#textArea').val(databaseName+' does not exists !');
        }
        else{            
            indexedDB.open(databaseName, 1).onsuccess = (e) => {
                if (e.target.result.objectStoreNames.contains(tableName)) {
                    dataUpload(databaseName, tableName);
                }
                else{
                    $('#textArea').val(tableName+' does not exists !');
                }
            };
        }
    }
});

$('#jsonFile').on('change', function(e){
    var file = e.target.files[0];
    var filereader = new FileReader();
    filereader.onload = function(){
        var data = filereader.result;
        $('#textArea').val(data);
    };
    filereader.readAsText(file);
});

// Save texarea dat to a json file

$('#btn-data-download').click(function(){
    var fileContent = $('#textArea').val();

    if(fileContent == ''){
        $('#textArea').val('There is no data to save !');
        return;
    }

    var fileName = 'data-indexedDB.json';
    var myFile = new Blob([fileContent], { type: 'text/json' });

    window.URL = window.URL || window.webkitURL;
    var dlBtn = $('#btn-data-download');

    dlBtn.attr('href', window.URL.createObjectURL(myFile));
    dlBtn.attr('download', fileName);
});


$('.eraser').click(function(e){
    e.preventDefault();
    $('#textArea').val('');
});