const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { faker } = require('@faker-js/faker');
require('dotenv').config();

const Employee = require('./models/Employee');
const Department = require('./models/Department');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongodb:27017/employee_db');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Routes

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Employee Management API is running!',
    endpoints: {
      generateData: 'POST /generateData',
      employees: 'GET /employees',
      departments: 'GET /departments',
      clearData: 'DELETE /clearData'
    }
  });
});

// Generate fake data
app.post('/generateData', async (req, res) => {
  try {
    const { employeeCount = 50, departmentCount = 6 } = req.body || {};

    // Clear existing data
    await Employee.deleteMany({});
    await Department.deleteMany({});

    // Generate departments
    const departments = ['IT', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations'];
    const departmentData = [];

    for (let i = 0; i < departmentCount; i++) {
      const dept = new Department({
        name: departments[i] || faker.commerce.department(),
        description: faker.lorem.sentence(),
        manager: faker.person.fullName(),
        budget: faker.number.int({ min: 100000, max: 2000000 }),
        location: faker.location.city(),
        employeeCount: 0
      });
      departmentData.push(dept);
    }

    await Department.insertMany(departmentData);

    // Generate employees
    const employeeData = [];
    const positions = [
      'Software Engineer', 'Senior Developer', 'Project Manager', 'Data Analyst',
      'Marketing Specialist', 'Sales Representative', 'HR Specialist', 'Accountant',
      'Team Lead', 'Quality Assurance', 'DevOps Engineer', 'Business Analyst'
    ];

    for (let i = 0; i < employeeCount; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const department = departments[Math.floor(Math.random() * departments.length)];
      
      const employee = new Employee({
        firstName,
        lastName,
        email: faker.internet.email({ firstName, lastName }).toLowerCase(),
        phone: faker.phone.number(),
        department,
        position: positions[Math.floor(Math.random() * positions.length)],
        salary: faker.number.int({ min: 30000, max: 150000 }),
        hireDate: faker.date.between({ 
          from: new Date('2020-01-01'), 
          to: new Date() 
        }),
        address: {
          street: faker.location.streetAddress(),
          city: faker.location.city(),
          state: faker.location.state(),
          zipCode: faker.location.zipCode(),
          country: faker.location.country()
        },
        status: faker.helpers.arrayElement(['active', 'active', 'active', 'inactive'])
      });
      
      employeeData.push(employee);
    }

    await Employee.insertMany(employeeData);

    // Update department employee counts
    for (const dept of departments) {
      const count = await Employee.countDocuments({ department: dept });
      await Department.updateOne({ name: dept }, { employeeCount: count });
    }

    res.json({
      message: 'Data generated successfully!',
      data: {
        employeesCreated: employeeCount,
        departmentsCreated: departmentCount
      }
    });

  } catch (error) {
    console.error('Error generating data:', error);
    res.status(500).json({ error: 'Failed to generate data' });
  }
});

// Get all employees
app.get('/employees', async (req, res) => {
  try {
    const { department, status, limit = 50 } = req.query;
    const filter = {};
    
    if (department) filter.department = department;
    if (status) filter.status = status;

    const employees = await Employee.find(filter)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    res.json({
      count: employees.length,
      employees
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// Get all departments
app.get('/departments', async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    res.json({
      count: departments.length,
      departments
    });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// Clear all data
app.delete('/clearData', async (req, res) => {
  try {
    await Employee.deleteMany({});
    await Department.deleteMany({});
    
    res.json({ message: 'All data cleared successfully!' });
  } catch (error) {
    console.error('Error clearing data:', error);
    res.status(500).json({ error: 'Failed to clear data' });
  }
});

// Get employee statistics
app.get('/stats', async (req, res) => {
  try {
    const totalEmployees = await Employee.countDocuments();
    const activeEmployees = await Employee.countDocuments({ status: 'active' });
    const departmentStats = await Employee.aggregate([
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 },
          avgSalary: { $avg: '$salary' }
        }
      }
    ]);

    res.json({
      totalEmployees,
      activeEmployees,
      departmentStats
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Start server
const startServer = async () => {
  await connectDB();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();