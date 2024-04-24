const request = require("supertest");
const db = require("../models/index");
const app = require("../app");

let server, agent;

describe("EasySplit Application", function () {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(3000, () => {});
    agent = request.agent(server);
  });

  afterAll(async () => {
    try {
      await db.sequelize.close();
      await server.close();
    } catch (error) {
      console.log(error);
    }
  });

  test("Sign up", async () => {
    let res = await agent.get("/signup");
    res = await agent.post("/users/create").send({
      firstName: "Test",
      lastName: "User 1",
      email: "user1@test.com",
      password: "password",
      groupName: "Test Group",
    });
    expect(res.statusCode).toBe(200);
  });

  // test adding new todos
  test("Creates a transaction", async () => {
    const agent = request.agent(server);
    const response = await agent.post("/transactions").send({
      amount: 100,
      description: "Test Transaction",
      forIds: [1],
      byId: 1,
    });
    expect(response.statusCode).toBe(200);
  });
});
