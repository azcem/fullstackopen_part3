import express, { request } from "express";
import morgan from "morgan";
import cors from "cors";
import Person from "./models/person.js";

const app = express();
app.use(express.static("dist"));
app.use(express.json());
app.use(cors());

morgan.token("request-body", (request, response) => {
  return JSON.stringify(request.body);
});

app.use(
  morgan(
    ":method :url :status :res[content-length] - :response-time ms :request-body",
  ),
);

app.get("/api/persons/", (request, response) => {
  Person.find({}).then((person) => {
    response.json(person);
  });
});

app.get("/info/", (request, response) => {
  Person.countDocuments().then((count) => {
    response.end(
      `<h2>Phonebook has info for ${count} people <br/> ${new Date().toString()}</h2>`,
    );
  });
});

app.get("/api/persons/:id", (request, response, next) => {
  Person.findById(request.params.id)
    .then((foundPerson) => {
      if (!foundPerson) {
        return response.status(404).end();
      }
      response.json(foundPerson);
    })
    .catch((error) => next(error));
});

app.delete("/api/persons/:id/", (request, response, next) => {
  Person.findByIdAndDelete(request.params.id)
    .then((person) => {
      response.status(204).end();
    })
    .catch((error) => next(error));
});

app.post("/api/persons/", (request, response, next) => {
  const body = request.body;

  if (!body.name)
    return response.status(400).json({ error: "name is mandatory" });
  if (!body.number)
    return response.status(400).json({ error: "number is mandatory" });
  const person = new Person({
    name: body.name,
    number: body.number,
  });
  person
    .save()
    .then((savedPerson) => {
      response.json(savedPerson);
    })
    .catch((error) => next(error));
});

app.put("/api/persons/:id", (request, response, next) => {
  const body = request.body;
  const person = {
    name: body.name,
    number: body.number,
  };
  Person.findByIdAndUpdate(request.params.id, person, {
    new: true,
    runValidators: true,
    context: "query",
  })
    .then((updatedPerson) => {
      response.json(updatedPerson);
    })
    .catch((error) => next(error));
});

const errorHandler = (error, request, response, next) => {
  console.error(error.message);
  if (error.name === "CastError") {
    return response.status(400).send({ error: "malformatted id" });
  } else if (error.name === "ValidationError") {
    return response.status(400).json({ error: error.message });
  }

  next(error);
};
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
