const { ObjectId } = require("mongodb");
const { db } = require("../db");
const { apiError, apiResponse } = require("../utils/common");

const userCollection = db.collection("user");

const options = {
  httpOnly: true,
  secure: true,
};

const addRole = async (req, res) => {
  try {
    const { userId, role, modules } = req.body;

    const user = await userCollection.findOne({ _id: new ObjectId(userId) });
    if (user) {
      const roles = [
        ...user.roles,
        {
          id: "RO" + +Math.floor(Math.random() * 10000),
          role,
          modules,
        },
      ];
      let updatedUser = await userCollection.updateOne(
        { _id: new ObjectId(userId) },
        {
          $set: {
            roles: roles,
          },
        }
      );

      if (updatedUser.acknowledged) {
        return apiResponse(res, 200, roles);
      } else {
        return apiError(res, 400, "DB fetch error");
      }
    } else {
      return apiError(res, 400, "User not found");
    }
  } catch (error) {
    return apiError(res, 500, error.message);
  }
};

const updateRole = async (req, res) => {
  try {
    const { userId, id, role, modules } = req.body;

    const user = await userCollection.findOne({ _id: new ObjectId(userId) });

    if (user) {
      let roles = [...user.roles];
      const idx = roles.findIndex((ele) => ele?.id === id);
      if (idx !== -1) {
        roles[idx].role = role;
        roles[idx].modules = modules;

        const updatedUser = await userCollection.updateOne(
          { _id: new ObjectId(userId) },
          {
            $set: {
              roles: roles,
            },
          }
        );

        if (updatedUser.acknowledged) {
          return apiResponse(res, 200, roles);
        } else {
          return apiError(res, 400, "DB fetch error");
        }
      } else {
        return apiError(res, 400, "Role not found");
      }
    } else {
      return apiError(res, 400, "User not found");
    }
  } catch (error) {
    return apiError(res, 500, error.message);
  }
};

const deleteRole = async (req, res) => {
  try {
    const { userId, id } = req.params;
    const user = await userCollection.findOne({ _id: new ObjectId(userId) });

    if (user) {
      const roles = [...user.roles];
      const filteredRoles = roles.filter((ele) => ele.id !== id);
      if (filteredRoles?.length < roles.length) {
        let updatedUser = await userCollection.updateOne(
          { _id: new ObjectId(userId) },
          {
            $set: {
              roles: filteredRoles,
            },
          }
        );

        if (updatedUser.acknowledged) {
          return apiResponse(res, 200, filteredRoles);
        } else {
          return apiError(res, 400, "DB fetch error");
        }
      } else {
        return apiError(res, 400, "Role not found");
      }
    } else {
      return apiError(res, 400, "User not found");
    }
  } catch (error) {
    return apiError(res, 500, error.message);
  }
};

const getRoles = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await userCollection.findOne({ _id: new ObjectId(userId) });

    if (user) {
      return apiResponse(res, 200, user.roles);
    } else {
      return apiError(res, 400, "User not found");
    }
  } catch (error) {
    return apiError(res, 500, error.message);
  }
};

module.exports = { addRole, updateRole, deleteRole, getRoles };
