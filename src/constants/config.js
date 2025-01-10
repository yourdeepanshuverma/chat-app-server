const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:4173",
    process.env.CORS_ORIGIN,
  ],
  methods: ["GET", "PUT", "POST", "DELETE"],
  credentials: true,
};

export { corsOptions };
