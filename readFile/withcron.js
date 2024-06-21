const Koa = require('koa');
const bodyParser = require('koa-body');
const csvParser = require('csv-parser');
const mysql = require('mysql');
const CronJob = require('cron').CronJob;
const fs = require('fs');

const app = new Koa();
const router = require('koa-router')();

// MySQL database connection setup
const connection = mysql.createConnection({
  host: 'your_database_host',
  user: 'your_database_user',
  password: 'your_database_password',
  database: 'your_database_name'
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  console.log('Connected to database');
});

// Koa-body middleware for handling file uploads
app.use(bodyParser({
  multipart: true,
  formidable: {
    uploadDir: __dirname + '/uploads',
    keepExtensions: true,
    maxFileSize: 200 * 1024 * 1024, // Limit upload file size to 200MB
  }
}));

// Route for handling file upload and data insertion
router.post('/upload', async (ctx) => {
  const file = ctx.request.files.csvFile;
  const reader = fs.createReadStream(file.path);

  // Parse CSV file
  const results = [];
  reader
    .pipe(csvParser())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      // Insert data into MySQL database
      const sql = 'INSERT INTO licenses (license_number, expiration_date, issued_by) VALUES (?, ?, ?)';
      results.forEach((row) => {
        const { license_number, expiration_date, issued_by } = row;
        const values = [license_number, expiration_date, issued_by];
        
        connection.query(sql, values, (err, result) => {
          if (err) {
            console.error('Error inserting data:', err);
          } else {
            console.log('Data inserted successfully:', result);
          }
        });
      });

      ctx.body = 'File uploaded and data inserted into database';
    });

  // Optionally, you can delete the uploaded file after processing
  // fs.unlinkSync(file.path);
});

// Register routes
app.use(router.routes());
app.use(router.allowedMethods());

// Cron job to process uploaded files periodically (every day at 2 AM)
new CronJob('0 2 * * *', () => {
  // Process files or any other periodic task here
  console.log('Cron job running at 2 AM');

  // Example: Process files in a directory
  fs.readdir(__dirname + '/uploads', (err, files) => {
    if (err) {
      console.error('Error reading directory:', err);
      return;
    }

    files.forEach((file) => {
      if (file.endsWith('.csv')) {
        const filePath = __dirname + '/uploads/' + file;
        const reader = fs.createReadStream(filePath);

        // Parse CSV file and insert data into database (similar to upload endpoint)
        const results = [];
        reader
          .pipe(csvParser())
          .on('data', (data) => results.push(data))
          .on('end', () => {
            const sql = 'INSERT INTO licenses (license_number, expiration_date, issued_by) VALUES (?, ?, ?)';
            results.forEach((row) => {
              const { license_number, expiration_date, issued_by } = row;
              const values = [license_number, expiration_date, issued_by];
              
              connection.query(sql, values, (err, result) => {
                if (err) {
                  console.error('Error inserting data:', err);
                } else {
                  console.log('Data inserted successfully:', result);
                }
              });
            });

            // Optionally, delete the processed file
            // fs.unlinkSync(filePath);
          });
      }
    });
  });
}, null, true, 'Your/Timezone'); // Replace 'Your/Timezone' with your timezone

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
