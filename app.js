const express = require("express");
// const csrf = require("csurf"); // using csrf
// const csrf = require("tiny-csrf");
const cors = require("cors");
const app = express();
const { Transaction, User, Group } = require("./models");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const path = require("path");

const passport = require("passport"); // using passport
const LocalStrategy = require("passport-local"); // using passport-local as strategy
const session = require("express-session");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const flash = require("connect-flash");
// eslint-disable-next-line no-undef
app.set("views", path.join(__dirname, "views"));
app.use(flash());

// enable CORS
app.use(cors());
app.options("*", cors());

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("some other secret string"));
// ["POST", "PUT", "DELETE"]));
// app.use(csrf({ cookie: true }));
// app.use(csrf("123456789iamasecret987654321look", // secret -- must be 32 bits or chars in length
// eslint-disable-next-line no-undef
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: "secret-key-that-no-one-can-guess",
    cookie: { maxAge: 24 * 60 * 60 * 1000 }, // 24 hours
  })
);
// simple comment

// passport config
app.use(passport.initialize());
app.use(passport.session());

// authentication
passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (username, password, done) => {
      User.findOne({
        where: {
          email: username,
        },
      })
        .then(async (user) => {
          const result = await bcrypt.compare(password, user.password);
          if (result) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Incorrect password" });
          }
        })
        .catch(() => {
          return done(null, false, { message: "User does not exists" });
        });
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((err) => {
      done(err, null);
    });
});

app.use(function (request, response, next) {
  response.locals.messages = request.flash();
  next();
});

app.set("view engine", "ejs");

app.get("/", async function (request, response) {
  response.send("Hello World");
});

app.get("/signup", (request, response) => {
  response.render("signup", {
    title: "Signup",
  });
});

app.get("/login", (request, response) => {
  response.render("login", {
    title: "Login",
  });
});

app.post("/session", (request, response) => {
  User.findOne({
    where: {
      email: request.body.email,
    },
  })
    .then(async (user) => {
      const result = await bcrypt.compare(request.body.password, user.password);
      if (result) {
        return response.send(user);
      } else {
        return response.send({ message: "Incorrect password" });
      }
    })
    .catch(() => {
      return response.send({ message: "User does not exists" });
    });
});

app.get("/signout", (request, response, next) => {
  request.logout((err) => {
    if (err) return next(err);
    response.redirect("/login");
  });
});

// =========================== New Code ===========================

app.get("/users/:groupId", async function (_request, response) {
  console.log("Processing list of all Users ...");
  try {
    const users = await User.getUsers(_request.params.groupId);
    response.send(users);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.get("/transactions/:userId", async function (request, response) {
  const userId = request.params.userId;
  const userAcc = await User.findByPk(userId);
  const userName = userAcc.firstName + " " + userAcc.lastName;
  const transactions = await Transaction.getTransactions(userId);
  response.json({
    transactions,
    userName,
  });
});

app.get("/transactions", async function (_request, response) {
  console.log("Processing list of all Transactions ...");
  try {
    const transactions = await Transaction.getAllTransactions();
    response.send(transactions);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.get("/transaction/:id", async function (request, response) {
  try {
    const todo = await Transaction.findByPk(request.params.id);
    return response.json(todo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.post("/users/create", async (request, response) => {
  const hashedPassword = await bcrypt.hash(request.body.password, saltRounds);
  try {
    const group = await Group.createGroup({
      name: request.body.groupName,
      members: [],
    });
    const user = await User.create({
      firstName: request.body.firstName,
      lastName: request.body.lastName,
      email: request.body.email,
      password: hashedPassword,
      groupId: group.id,
    });
    await Group.updateGroup({
      id: group.id,
      name: group.name,
      members: [user.id],
    });
    request.login(user, (err) => {
      if (err) {
        console.log(err);
      }
      response.json(user);
    });
  } catch (error) {
    // request.flash("error", "Email already registered");
    return response.send(error);
  }
});
app.post("/users/join", async (request, response) => {
  const hashedPassword = await bcrypt.hash(request.body.password, saltRounds);

  try {
    const user = await User.create({
      firstName: request.body.firstName,
      lastName: request.body.lastName,
      email: request.body.email,
      password: hashedPassword,
      groupId: request.body.groupCode,
    });
    const group = await Group.getGroup(request.body.groupCode);
    await Group.updateGroup({
      id: group.id,
      name: group.name,
      members: [...group.members, user.id],
    });
    request.login(user, (err) => {
      if (err) {
        console.log(err);
      }
      response.json(user);
    });
  } catch (error) {
    // request.flash("error", "Email already registered");
    return response.send(error);
  }
});

app.post("/transactions", async function (request, response) {
  const forList = request.body.forId;
  console.log(forList);
  // const mylist = JSON.parse(forList);
  try {
    await Transaction.addTransaction({
      amount: request.body.amount,
      description: request.body.description,
      forIds: forList,
      byId: request.body.userId,
    });
    return response.json({ success: true });
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

// TODO: Add a route to update a transaction
app.put("/transactions/:id/", async function (request, response) {
  const todo = await Transaction.findByPk(request.params.id);
  if (todo.by === request.body.userId) {
    try {
      const updatedTransaction = await todo.setCompletionStatus(
        request.body.completed
      );
      return response.json(updatedTransaction);
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  } else {
    return response
      .status(403)
      .json({ error: "You are not authorized to update this todo" });
  }
});

app.delete("/transactions/:id", async function (request, response) {
  console.log("Deleting a Todo with ID: ", request.params.id);
  try {
    await Transaction.remove(request.params.id);
    const todos = await Transaction.findByPk(request.params.id);
    if (todos) {
      return response.json({ success: false });
    } else {
      return response.json({ success: true });
    }
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.post("/group", async function (request, response) {
  const members = request.body.members;
  const mylist = JSON.parse(members);
  try {
    const group = await Group.createGroup({
      name: request.body.name,
      members: mylist,
    });
    response.send(group);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.put("/group/:id", async function (request, response) {
  const members = request.body.members;
  const mylist = JSON.parse(members);
  try {
    const group = await Group.updateGroup({
      id: request.params.id,
      name: request.body.name,
      members: mylist,
    });
    response.send(group);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.get("/group", async function (request, response) {
  try {
    const groups = await Group.getGroups();
    response.send(groups);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.get("/group/:id", async function (request, response) {
  try {
    const group = await Group.getGroup(request.params.id);
    response.send(group);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

// =========================== New Code ===========================

//testing route
app.get("/test_todos", async function (_request, response) {
  console.log("Processing list of all Todos ...");
  try {
    const todos = await Transaction.findAll();
    response.send(todos);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

module.exports = app;
