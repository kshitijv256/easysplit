"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Group extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Group.hasMany(models.User, {
        foreignKey: "groupId",
      });
    }

    static async createGroup({ name, members }) {
      return await this.create({
        name: name,
        members: members,
      });
    }

    static async getGroups() {
      return await this.findAll();
    }

    static async getGroup(id) {
      return await this.findByPk(id);
    }

    static async updateGroup({ id, name, members }) {
      return await this.update(
        {
          name: name,
          members: members,
        },
        {
          where: {
            id: id,
          },
        }
      );
    }
  }
  Group.init(
    {
      name: DataTypes.STRING,
      members: DataTypes.ARRAY(DataTypes.INTEGER),
    },
    {
      sequelize,
      modelName: "Group",
    }
  );
  return Group;
};
