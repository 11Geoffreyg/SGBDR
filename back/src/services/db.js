import mysql from 'mysql2/promise'

const getConnection = async () => {
    return await mysql.createConnection({
        host: '163.172.130.142',
        port: 3310,
        user: 'etudiant',
        password: 'CrERP29qwMNvcbnAMgLzW9CwuTC5eJHn',
        database: 'sakila'
    })
}

export default getConnection