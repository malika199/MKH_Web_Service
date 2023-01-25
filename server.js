const http = require("http");
const fs = require("fs");
const data = require("./db.json");
const crypto = require("crypto");

const port = 8000;
const hostname = "localhost";

function setHeader(res, status) {
  res.writeHead(status, { "Content-type": "application/json" });
}

// Helper used to send a message with a map of values
function sendEnum(res, name, value) {
  const keys = value?.map((el) => Object.keys(el)?.[0]);
  res.end(
    `{"message": "Please select one of the following ${name} : ${keys.map(
      (el) => "\n/" + el
    )}\n"}`
  );
}

setInterval(function writeFile(content) {
  fs.writeFileSync("./db.json", JSON.stringify(content), (err) => {
    if (err) {
      console.error(err);
    }
  });
}, 1000);

function isDefined(variable) {
  return variable != undefined;
}

function reqHandler(req, res) {
  const { url, method } = req;
  const isGetMethod = method === "GET";
  const isPostMethod = method === "POST";
  const isPutMethod = method === "PUT";
  const isDeleteMethod = method === "DELETE";

  const urlSplited = url.split("/");

  const db = urlSplited[1];
  const selectedDb = data?.find((el) => Object.keys(el)[0] == db)?.[db] || [];

  const route = urlSplited[2];
  const selectedRoute =
  selectedDb?.find((el) => Object.keys(el)?.[0] == route)?.[route] || [];

  const id = urlSplited[3];
  const selectedProperty = selectedRoute?.find((el) => el.id == id);

  /**
   * Sequence of conditions
   * No dataBase => GET all databases, POST create DB, PUT edit DB, DELETE delete DB (if DB name provided)
   * database => check for table
   *
   * No table => GET all tables, POST create table, PUT edit table, DELETE delete tables (if table name provided)
   * table => check for property
   *
   * No property id => GET all properties, POST create property, PUT edit property, DELETE delete property (if property id provided)
   * property => send property infos
   */
  if (!db || db == "/" || selectedDb.length == 0) {
    if (isGetMethod) {
      setHeader(res, 404);
      sendEnum(res, "DataBases", data);
    } else if (isPostMethod) {
      createDataBase(req, res);
      setHeader(res, 200);
      res.end('{ "message": "Database created successfully"}');
    } else if (isPutMethod) {
      updateDatabase( req, res);
      setHeader(res, 200);
      res.end('{ "message": "Database edited successfully"}');
    } else if (isDeleteMethod) {
      deleteDataBase(data, req, res);
      setHeader(res, 200);
      res.end('{ "message": "Database deleted successfully"}');
    }
  } else {
    if (!route || route == "/" || selectedRoute.length == 0) {
     
      if (isGetMethod) {
        // searchObject(db, req, res);
        setHeader(res, 200);
        sendEnum(res, "Routes", selectedDb);
      } else if (isPostMethod) {
        createTable(db, req, res);
      } else if (isPutMethod) {
        updateTable(db, route, req, res);
        setHeader(res, 200);
      } else if (isDeleteMethod) {
        setHeader(res, 200);
      }
    } else {
      if (isGetMethod) {
        if (!id || id == "/" || !selectedProperty) {
          setHeader(res, 200);
          res.end(JSON.stringify(selectedRoute));
        } else {
          setHeader(res, 200);
          res.end(JSON.stringify(selectedProperty));
        }
      } else if (isPostMethod) {
        createObject(db, route, req, res);
        setHeader(res, 200);
      } else if (isPutMethod) {
        updateObject(db, route, id, req, res);
        setHeader(res, 200);
      } else if (isDeleteMethod) {
        setHeader(res, 200);
      }
    }
  }
}

const server = http.createServer(reqHandler);
server.listen(port, hostname, (err) => {
  if (err) {
    console.log("ERROR ⛔ :" + err);
  }
  console.log("SERVER is running 🔥 at port : " + port);
});
function createDataBase(req, res) {
  let body = [];
  req.on("data", function (data) {
    body.push(data);
  });
  req.on("end", function () {
    let content;
    body = JSON.parse(Buffer.concat(body).toString());

    const alreadyExist = data.some(
      (item) => Object.keys(item)[0] === body.name
    );

    console.log("alreadyExist", alreadyExist);

    if (isDefined(body.name)) {
      if (!alreadyExist) {
        console.log("body.tables", body.tables);
        content = {
          [body.name]: isDefined(body.tables) ? body.tables : [],
        };
        data.push(content);
        writeFile(data);
        setHeader(res, 200);
        res.end('{ "message": "Database created successfully"}');
      } else {
        setHeader(res, 404);
        res.end('{ "message": "database already exist "}');
      }
    } else {
      setHeader(res, 404);
      res.end('{ "message": "Must provide a database name"}');
    }
  });
}

function deleteDataBase(dataBase, req, res) {
  let body = [];
  req.on("data", function (data) {
    body.push(data);
  });
  req.on("end", function () {
    body = JSON.parse(Buffer.concat(body).toString());
    if (isDefined(body.name)) {
      const filtredDataBase = dataBase.filter(
        (el) => Object.keys(el)[0] !== body.name
      );
      writeFile(filtredDataBase);
    } else {
      setHeader(res, 404);
      res.end('{ "message": "Must provide a database name"}');
    }
  });
}

function updateDatabase(req, res) {
  let body = [];
  req.on("data", function (data) {
    body.push(data);
  });
  req.on("end", function () {
    let content;
    body = JSON.parse(Buffer.concat(body).toString());

    const databaseIndex = data.findIndex(
      (item) => Object.keys(item)[0] === body.name
    );

    if (isDefined(body.name) && databaseIndex !== -1) {
      content = {
        [body.name]: isDefined(body.tables) ? body.tables : [],
      };
      data[databaseIndex] = content;
      writeFile(data);
      setHeader(res, 200);
      res.end('{ "message": "Database updated successfully"}');
    } else {
      setHeader(res, 404);
      res.end('{ "message": "No such database found"}');
    }
  });
}


function updateTable(dataBaseName, tableName, req, res) {
  let body = [];
  req.on("data", function (data) {
    body.push(data);
  });
  req.on("end", function () {
    let content;
    try {
      body = JSON.parse(Buffer.concat(body).toString());
    } catch (err) {
      setHeader(res, 400);
      res.end('{ "message": "Invalid JSON data" }');
      return;
    }

    if (!body.name) {
      setHeader(res, 404);
      res.end('{ "message": "Must provide a database name"}');
      return;
    }

    content = {
      [body.name]: body.properties || [],
    };

    const dbExist = data.find((db) => Object.keys(db)[0] === dataBaseName);
    if (!dbExist) {
      setHeader(res, 404);
      res.end(`{ "message": "Database ${dataBaseName} not found" }`);
      return;
    }

    const tableIndex = dbExist[dataBaseName].findIndex(
      (table) => Object.keys(table)[0] === tableName
    );

    if (tableIndex === -1) {
      setHeader(res, 404);
      res.end(`{ "message": "Table ${tableName} not found in ${dataBaseName} database" }`);
      return;
    }

    dbExist[dataBaseName][tableIndex] = content;
    writeFile(data);

    setHeader(res, 200);
    res.end(`{ "message": "Table ${tableName} updated successfully in ${dataBaseName} database" }`);
  });
}

function updateObject(dataBaseName, tableName, id, req, res) {
  let body = [];
  req.on("data", function (data) {
    body.push(data);
  });
  req.on("end", function () {
    let updatedObject;
    try {
      body = JSON.parse(Buffer.concat(body).toString());
    } catch (err) {
      setHeader(res, 400);
      res.end('{ "message": "Invalid JSON data" }');
      return;
    }

    // check if database exists
    const dbExist = data.find((db) => Object.keys(db)[0] === dataBaseName);
    if (!dbExist) {
      setHeader(res, 404);
      res.end(`{ "message": "Database ${dataBaseName} not found" }`);
      return;
    }

    // check if table exists in the database
    const tableExist = dbExist[dataBaseName].find(
      (table) => Object.keys(table)[0] === tableName
    );
    if (!tableExist) {
      setHeader(res, 404);
      res.end(`{ "message": "Table ${tableName} not found in ${dataBaseName} database" }`);
      return;
    }

    // check if object exists in the table
    const objectIndex = tableExist[tableName].findIndex((obj) => obj.id === id);
    if (objectIndex === -1) {
      setHeader(res, 404);
      res.end(`{ "message": "Object with id ${id} not found in ${tableName} table" }`);
      return;
    }
    updatedObject = { ...tableExist[tableName][objectIndex], ...body };
    tableExist[tableName][objectIndex] = updatedObject;

    writeFile(data);
    setHeader(res, 200);
    res.end(`{ "message": "Object with id ${id} updated successfully in ${tableName} table" }`);
  });
}

function searchObject(dataBaseName, table, key, value, req, res) {
  let BDD;
  for (let i = 0; i < data.length; i++) {
    if (Object.keys(data[i])[0] === dataBaseName) {
      BDD = data[i][dataBaseName];
      for (let index = 0; index < BDD.length; index++) {
        if (Object.keys(BDD[index]) == table) {
          let tableData = BDD[index][table];
          for (let j = 0; j < tableData.length; j++) {
            if (tableData[j][key] === value) {
              setHeader(res, 200);
              res.end(JSON.stringify(tableData[j]));
              return;
            }
          }
        }
      }
    }
  }
  setHeader(res, 404);
  res.end(`{ "message": "No object found with ${key} = ${value} in ${dataBaseName}.${table}"}`);
}

function createTable(dataBaseName, req, res) {
  let body = [];
  req.on("data", function (data) {
    body.push(data);
  });
  req.on("end", function () {
    let content;
    body = JSON.parse(Buffer.concat(body).toString());
    console.log("body  :  ", body);
    if (isDefined(body.name)) {
      content = {
        [body.name]: isDefined(body.properties) ? body.properties : [],
      };
      for (let i = 0; i < data.length; i++) {
        console.log("data", data);
        if (Object.keys(data[i])[0] === dataBaseName) {
          // console.log('data[i])[0]',data[i][dataBaseName])
          const alreadyExist = data[i][dataBaseName].some(
            (item) => Object.keys(item)[0] === body.name
          );
          console.log("alreadyExist", alreadyExist);
          if (!alreadyExist) {
            data[i][dataBaseName].push(content);
            console.log("dataBaseName", dataBaseName);
            setHeader(res, 200);
            res.end('{ "message": "Table created successfully"}');
          } else {
            setHeader(res, 404);
            res.end('{ "message": "table existe already"}');
          }
        }
      }
      writeFile(data);
    } else {
      setHeader(res, 404);
      res.end('{ "message": "Must provide a database name"}');
    }
  });
}

// console.log(generateUniqueId());
function createObject(dataBaseName, table, req, res) {
  console.log("ooooooooooo", { dataBaseName, table });
  let body = [];
  let id = crypto.randomBytes(20).toString("hex");

  req.on("data", function (data) {
    body.push(data);
  });
  req.on("end", function () {
    let BDD;
    body = JSON.parse(Buffer.concat(body).toString());
    body.id = id;
    // console.log('bodyyyyyyyyyyyyyyyyyyyyyyyyyyy',body)

    if (isDefined(body)) {
      data.map((el) => console.log("test ", el));
      for (let i = 0; i < data.length; i++) {
        if (Object.keys(data[i])[0] === dataBaseName) {
          BDD = data[i][dataBaseName];
          console.log("BDD", BDD);
          for (let index = 0; index < BDD.length; index++) {
            console.log("BD", Object.keys(BDD[index]));
            if (Object.keys(BDD[index]) == table) {
              BDD[index][table] = [...BDD[index][table], body];
            }
          }
          writeFile(data);
        }
      }
    } else {
      setHeader(res, 404);
      res.end('{ "message": "Must provide a database name"}');
    }
  });
}
function deleteTable(dataBase, req, res) {
  let body = [];
  req.on("data", function (data) {
    body.push(data);
  });
  req.on("end", function () {
    body = JSON.parse(Buffer.concat(body).toString());
    if (isDefined(body.name)) {   
      const filtredDataBase = dataBase.filter(
        (el) => Object.keys(el)[0] !== body.name
      );
      writeFile(filtredDataBase);
    } else {
      setHeader(res, 404);
      res.end('{ "message": "Must provide a database name"}');
    }
  });
}