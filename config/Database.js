import { Sequelize } from "sequelize";
 
const db = new Sequelize('railway', 'root', '7TRLbLmVJWeSmy5LOfYN', {
    host: "containers-us-west-131.railway.app",
    port: "6972",
    dialect: "mysql"
});
 
export default db;