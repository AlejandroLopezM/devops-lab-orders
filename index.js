const { app } = require('./src/app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Orders service running on port ${PORT}`);
});
