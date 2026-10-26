process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? "postgresql://swapdo:swapdo_dev@localhost:5432/swapdo_test?schema=public";
process.env.PAYMENT_PROVIDER = "mock";
process.env.MOCK_WEBHOOK_SECRET = "test_secret";
