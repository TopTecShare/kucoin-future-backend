module.exports = (sequelize, Sequelize) => {
  const History = sequelize.define("histories", {
    contracts: {
      type: Sequelize.STRING,
    },

    type: {
      type: Sequelize.STRING,
    },

    PNL: {
      type: Sequelize.DOUBLE,
    },

    remain: {
      type: Sequelize.DOUBLE,
    },

    position: {
      type: Sequelize.BIGINT,
    },
  });

  return History;
};
