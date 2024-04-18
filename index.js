const express = require('express');
const redis = require('redis');
const app = express();
const redisClient = redis.createClient({
    host: "localhost",
    port: 6379
});

const { Client } = require("pg");
const pgClient = new Client({
    host: "localhost",
    user: "user",
    port: "5432",
    password: "example",
    database: "app",
});
module.exports = pgClient;

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.connect();

app.get('/blogs/:id', async (req, res) => {
    const blogId = parseInt(req.params.id);
    const blogDataFromCache = await redisClient.get(`blog:${blogId}`);
    if (blogDataFromCache) {
        const blogData = JSON.parse(blogDataFromCache);
        res.json(blogData);
        return;
    }

    const sql = 'SELECT * FROM blog WHERE id = $1';
    const values = [blogId];
    const { rows } = await pgClient.query(sql, values);
    if (rows.length===0) {
        res.status(404).json({ message: 'Blog yazısı bulunamadı' });
        return;
    }

    const blogData = rows[0];
    const blog= {
        title: blogData.title,
        content: blogData.connect,
    };
    await redisClient.set(`blog:${blogId}`, JSON.stringify(blog));
    res.json(blog);
});

app.listen(3000, () => {
    console.log('listening on port 3000');
});
