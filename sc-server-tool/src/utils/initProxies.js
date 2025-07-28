const fs = require('fs');
const path = require('path');
const csv = require('fast-csv');
const { Transform } = require('stream');

async function initProxies() {
  try {
    const ProxyModel = getModel('Proxy');
    
    // Kiểm tra xem đã có proxies trong database chưa
    const existingProxies = await ProxyModel.countDocuments();
    if (existingProxies > 0) {
      console.log('Proxies already exist. Skipping initialization.');
      return;
    }

    const csvFilePath = path.join(__dirname, '../../config/proxies.csv');
    const batchSize = 5000; // Số lượng bản ghi trong mỗi batch
    let totalInserted = 0;
    let currentBatch = [];
    let currentId = await getNextId(ProxyModel, batchSize);

    const transformStream = new Transform({
      objectMode: true,
      transform(chunk, encoding, callback) {
        currentBatch.push({
          id: currentId++,
          server: chunk.server,
          username: chunk.username,
          password: chunk.password
        });

        if (currentBatch.length >= batchSize) {
          this.push(currentBatch);
          totalInserted += currentBatch.length;
          currentBatch = [];
          console.log(`Processed ${totalInserted} records`);
        }
        callback();
      },
      flush(callback) {
        if (currentBatch.length > 0) {
          this.push(currentBatch);
          totalInserted += currentBatch.length;
        }
        callback();
      }
    });

    const bulkInsert = async (batch) => {
      const bulk = ProxyModel.collection.initializeUnorderedBulkOp();
      batch.forEach(doc => bulk.insert(doc));
      await bulk.execute();
    };

    await new Promise((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(csv.parse({ headers: true }))
        .pipe(transformStream)
        .on('data', async (batch) => {
          try {
            await bulkInsert(batch);
          } catch (error) {
            console.error('Error inserting batch:', error);
          }
        })
        .on('end', () => {
          console.log(`Proxies initialized successfully. Total inserted: ${totalInserted}`);
          resolve();
        })
        .on('error', (error) => {
          console.error('Error processing CSV:', error);
          reject(error);
        });
    });

  } catch (error) {
    console.error('Error in initProxies:', error);
  }
}

async function getNextId(Model, count) {
  const ID = getModel('ID');
  const { seq } = await ID.findOneAndUpdate(
    { model: Model.modelName },
    { $inc: { seq: count } },
    { new: true, upsert: true }
  );
  return seq - count + 1;
}

module.exports = initProxies;