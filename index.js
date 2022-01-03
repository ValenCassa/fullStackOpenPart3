require('dotenv').config()
const express = require('express')
const app = express()
const morgan = require('morgan')
const cors = require('cors')
const Person = require('./models/person')



app.use(cors())
app.use(express.static('build'))
app.use(express.json())
app.use(morgan(':method :url :status :res[content-length] - :response-time ms - :content'))

morgan.token('content', (request, response) => {
    return JSON.stringify(request.body)
})

const errorHandler = (error, request, response, next) => {
    console.error(error.message)
  
    if (error.name === 'CastError') {
      return response.status(400).send({ error: 'malformatted id' })
    } else if (error.name === 'ValidationError') {
        return response.status(400).json({ error: error.message })
    }
  
    next(error)
  }

app.get('/api/persons', (request, response) => {
    Person.find({}).then(p => {
        response.json(p)
    })
})

app.get('/info', (request, response) => {
    Person.countDocuments().then(count => {
        const text = `
        <p>Phonebook has info for ${count} people</p>
        <p>${new Date()}</p>
        `
        response.send(text)
    })


})

// Find person by ID

app.get('/api/persons/:id', (request, response, next) => {
    Person.findById(request.params.id)
    .then(p => {
        if(p) {
            response.json(p)
        }else {
            response.status(404).end()
        }
    })
    .catch(error => next(error))
})


// Delete person by ID

app.delete('/api/persons/:id', (request, response, next) => {
    Person.findByIdAndRemove(request.params.id)
        .then(() => {
            response.status(204).end()
        })
        .catch(error => next(error))
})

//Update number

app.put('/api/persons/:id', (request, response, next) => {
    const body = request.body

    const newPerson = {
        name: body.name,
        number: body.number 
    }

    Person.findByIdAndUpdate(request.params.id, newPerson, {new: true})
        .then(updatedPerson => {
            response.json(updatedPerson)
        })
        .catch(error => next(error))
})



//Add person
app.post('/api/persons', (request, response, next) => {
    const body = request.body

    const person = new Person({
        name: body.name,
        number: body.number,
    })

    person.save()
        .then(savedPerson => {
         response.json(savedPerson.toJSON())
        })
        .catch(error => next(error.message))
})

app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})