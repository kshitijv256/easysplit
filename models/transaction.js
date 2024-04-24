"use strict";
const { Op } = require("sequelize");
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Transaction extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Transaction.belongsTo(models.User, {
        foreignKey: "by",
      });
    }

    static async getTransactions(userId) {
      return await Transaction.findAll({
        where: {
          [Op.or]: [
            {
              for: {
                [Op.contains]: [userId],
              },
            },
            {
              by: userId,
            },
          ],
        },
        order: [["id", "ASC"]],
      });
    }

    static async addTransaction({ amount, description, forIds, byId }) {
      return await this.create({
        amount: amount,
        description: description,
        for: forIds,
        by: byId,
      });
    }

    static async remove(id) {
      return await this.destroy({
        where: {
          id: id,
        },
      });
    }

    setCompletionStatus(status) {
      return this.update({ completed: status });
    }
    static async getAllTransactions() {
      return await this.findAll();
    }
  }
  Transaction.init(
    {
      amount: {
        type: DataTypes.DOUBLE,
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING,
      },
      for: {
        type: DataTypes.ARRAY(DataTypes.INTEGER),
      },
      by: {
        type: DataTypes.INTEGER,
      },
      completed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: "Transaction",
    }
  );
  return Transaction;
};
