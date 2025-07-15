const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  manager: {
    type: String,
    required: true
  },
  budget: {
    type: Number,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  employeeCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Department', departmentSchema);