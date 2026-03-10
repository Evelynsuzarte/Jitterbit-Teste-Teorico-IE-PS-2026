const express = require("express")
const sqlite3 = require("sqlite3").verbose()
const jwt = require("jsonwebtoken")


const PORT = 3000
const app = express()
app.use(express.json())
const SECRET = "admin"

// inicialização do banco de dados --------------------------------------
const db = new sqlite3.Database("pedidos.db")

db.run(`
CREATE TABLE IF NOT EXISTS orders (
    orderId INTEGER PRIMARY KEY,
    value DOUBLE,
    creationDate TEXT
)
`)

db.run(`
CREATE TABLE IF NOT EXISTS items (
    orderId INTEGER,
    productId INTEGER,
    quantity INTEGER,
    price DOUBLE,
    FOREIGN KEY (orderId) REFERENCES orders(orderId)
)
`)


// autenticação -------------------------------

//endpoint para fazer login
app.post("/login", (req,res)=>{
    console.log(req.body)
    const { username, password } = req.body
    if(username === "admin" && password === "admin"){
        const token = jwt.sign({username:username},SECRET,{expiresIn:"1h"})
        return res.json({token})
    }
    res.status(401).json({ 
        "error":"Credencial inválida" 
    })
})


//função de autenticação
function authenticateToken(req,res,next){
    const authHeader = req.headers["authorization"]
    const token = authHeader && authHeader.split(" ")[1]
    if(!token){
        return res.status(401).json({
                "error": "Token ausente"
        })
    }
    jwt.verify(token, SECRET, (err,user)=>{
        if(err){
            return res.status(403).json({
                "error": "Token invalido",
                "detalhe": err.message
            })
        }
        req.user = user
        next()
    })
}

// edpoints ---------------------------------------------------------

//endpoint para adicionar ordem
app.post("/order", authenticateToken, (req, res) => {
    const { orderId, value, creationDate, items } = req.body
    db.run(
        "INSERT INTO orders (orderId, value, creationDate) VALUES (?, ?, ?)",
        [orderId, value, creationDate],
        function(err){
            if(err){
                return res.status(500).json({
                    "error": "Error creating order",
                    "detail": err.message
                })
            }
            // inserção de itens na tabela de items
            if(items && items.length > 0){
                items.forEach(item => {
                    db.run(
                        "INSERT INTO items (orderId, productId, quantity, price) VALUES (?, ?, ?, ?)",
                        [orderId, item.productId, item.quantity, item.price]
                    )
                })
            }
            res.json({
                "orderId": orderId,
                "value": value,
                "creationDate": creationDate,
                "items": items || []
            })
        }
    )
})

//endpoint para buscar todas as ordens
app.get("/order/list", authenticateToken, (req, res) => {
    // query de join entre as tabelas de ordens e items, com junção entre tabelas onde tenta encontrar os itens das ordens                                                                                                                                                                                  
    const query = `
        SELECT 
            o.orderId,     
            o.value,
            o.creationDate,
            i.productId,
            i.quantity,
            i.price
        FROM orders o
        LEFT JOIN items i ON o.orderId = i.orderId
        ORDER BY o.orderId
    `

    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).json({
                error: "Erro ao buscar ordens",
                detail: err.message
            })
        }

        const orders = {}
        rows.forEach(row => {
            if (!orders[row.orderId]) {
                orders[row.orderId] = {
                    orderId: row.orderId,
                    value: row.value,
                    creationDate: row.creationDate,
                    items: []
                }
            }
            if (row.productId !== null) {
                orders[row.orderId].items.push({
                    orderId: row.orderId,
                    productId: row.productId,
                    quantity: row.quantity,
                    price: row.price
                })
            }

        })
        res.json(Object.values(orders))
    })
})

//endpoint para buscar ordem por id
app.get("/order/:orderId", authenticateToken, (req, res) => {
    const orderId = req.params.orderId
    db.get( "SELECT * FROM orders WHERE orderId = ?",[orderId],(err, order) => {
        if (err) {
            return res.status(500).json({
                error: "Erro ao buscar a ordem",
                detail: err.message
            })
        }
        if (!order) {
            return res.status(404).json({
                error: `Ordem ${orderId} não encontrada`
            })
        }
        db.all("SELECT orderId, productId, quantity, price FROM items WHERE orderId = ?",[orderId],(err, items) => {
            if (err) {
                return res.status(500).json({
                    error: "Erro ao buscar items",
                    detail: err.message
                })
            }

            res.json({
                orderId: order.orderId,
                value: order.value,
                creationDate: order.creationDate,
                items: items
            })
        }
        )
    }
    )
})



//endpoint para atualizar apenas o valor da ordem
app.patch("/order/:orderId", authenticateToken, (req, res) => {
    const { orderId } = req.params
    const { value, creationDate } = req.body

    db.run("UPDATE orders SET value = ?, creationDate = ? WHERE orderId = ?",[value, creationDate, orderId],
        function(err){
            if(err){
                return res.status(500).json({
                    "erro": `Erro ao atualizar a ordem ${orderId}`,
                    "detalhe": err.message
                })
            }
            res.json({
                message: "Ordem atualizada"
            })
        }
    )
})


//endpoint para deletar ordem
app.delete("/order/:orderId", authenticateToken, (req, res) => {
    const { orderId } = req.params
    db.run("DELETE FROM items WHERE orderId = ?", [orderId])
    db.run("DELETE FROM orders WHERE orderId = ?",[orderId],function(err){
        if(err){
            return res.status(500).json({
                "erro": `Erro ao deletar a ordem ${orderId}`,
                "detalhe": err.message
            })
        }
        res.json({
            message: "Ordem deletada"
        })
    })
})


//-------------------------------------------------------------

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`)
})