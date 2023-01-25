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

function writeFile(content) {
  console.log("content pour write in file", content);
  fs.writeFile("./db.json", JSON.stringify(content), (err) => {
    if (err) {
      console.error(err);
    }
  });
}

function isDefined(variable) {
  console.log("variable", variable);
  return variable != undefined;
}

function reqHandler(req, res) {
  const { url, method } = req;

  const isGetMethod = method === "GET";
  const isPostMethod = method === "POST";
  const isPutMethod = method === "PUT";
  const isDeleteMethod = method === "DELETE";
  // console.log("url ::", url);
  const urlSplited = url.split("/");

  // console.log("urlSplited", urlSplited);
  const db = urlSplited[1];
  // console.log("db  ", db);

  const selectedDb = data?.find((el) => Object.keys(el)[0] == db)?.[db] || [];

  const selecteDTable =  selectedDb?.find((el) => Object.keys(el)[0] == tble)?.[tble] || [];

  // console.log(" selectedDb ", selectedDb);
  const route = urlSplited[2];
  // console.log("route  ", route);

  const selectedRoute =
    selectedDb?.find((el) => Object.keys(el)?.[0] == route)?.[route] || [];

  // console.log("selectedRoute", selectedRoute);
  const id = urlSplited[3];
  const selectedProperty = selectedRoute?.find((el) => el.id == id);
  // console.log(" selectedProperty : ", selectedProperty);
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
  if (!db || (db == "/" && selectedDb.length == 0)) {
    if (isGetMethod) {
      setHeader(res, 404);
      sendEnum(res, "DataBases", data);
    } else if (isPostMethod) {
      createDataBase(req, res);
    } else if (isPutMethod) {
      updateDataBase(data, req, res);
      setHeader(res, 200);
      res.end('{ "message": "Database edited successfully"}');
    } else if (isDeleteMethod) {
      deleteDataBase(data, req, res);
      setHeader(res, 200);
      res.end('{ "message": "Database deleted successfully"}');
    }
  } else if (db.length !== 0 && isDefined(route)) {
    if (isPostMethod) {
      createObject(db, route, req, res);
      setHeader(res, 200);
      res.end('{ "message": "Object created successfully"}');
    } else if (isDeleteMethod) {
      deleteObject(db, route, req, res);
    }
  } else {
    // console.log("route", route);
    if (db.length !== 0 && !isDefined(route)) {
      if (isGetMethod) {
        setHeader(res, 200);
        sendEnum(res, "Routes", selectedDb);
      } else if (isPostMethod) {
        createTable(db, req, res);
      } else if (isPutMethod) {
        setHeader(res, 200);
      } else if (isDeleteMethod) {
        deleteTable(db, req, res);
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
        setHeader(res, 200);
      } else if (isPutMethod) {
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

function updateDataBase(dataBase, req, res) {
  deleteDataBase(dataBase, req, res);
  createDataBase(req, res);
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
    let dataToPush = data.map((item) => {
      console.log(item);
      if (Object.keys(item)[0] == dataBase) {
        let BDD = item[dataBase];
        item[Object.keys(item)] = BDD.filter(
          (el) => Object.keys(el)[0] !== body.name
        );
        setHeader(res, 200);
        res.end('{ "message": "Table deleted successfully"}');
      } else {
        setHeader(res, 404);
        res.end('{ "message": "Must provide a database name"}');
      }
      return item;
    });
    console.log("dataToPush", dataToPush);
    writeFile(dataToPush);
  });
}

function deleteObject(dataBaseName, table, req, res) {
  let body = [];
  req.on("data", function (data) {
    body.push(data);
  });
  req.on("end", function () {
    let BDD;
    body = JSON.parse(Buffer.concat(body).toString());
    if (isDefined(body)) {
      data.map((el) => console.log("test ", el));
      for (let i = 0; i < data.length; i++) {
        if (Object.keys(data[i])[0] === dataBaseName) {
          BDD = data[i][dataBaseName];
          for (let index = 0; index < BDD.length; index++) {
            if (Object.keys(BDD[index]) == table) {
              BDD[index][table] = BDD[index][table].filter(
                (obj) => obj.id !== body.id
              );
            }
          }
          writeFile(data);
          setHeader(res, 200);
          res.end('{ "message": "Object deleted successfully"}');
        }
      }
    } else {
      setHeader(res, 404);
      res.end('{ "message": "Must provide a database name"}');
    }
  });
}

