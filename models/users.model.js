module.exports = (sequelize, Sequelize) => {
  const Users = sequelize.define("users", {
    wallet: {
      type: Sequelize.STRING,
    },

    referer: {
      type: Sequelize.STRING,
    },

    refercode: {
      type: Sequelize.STRING,
    },

    bonus: {
      type: Sequelize.DOUBLE,
    },
  });

  return Users;
};
