import { Sequelize } from "sequelize";
 
const db = new Sequelize('railway', 'root', 'y97ajOE1sRWjE9fjJfMG', {
    host: "containers-us-west-159.railway.app",
    port: "5601",
    dialect: "mysql"
});
 
export default db;