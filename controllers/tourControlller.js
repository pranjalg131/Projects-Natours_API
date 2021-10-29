const fs = require('fs');

const PATH = `${__dirname}/../dev-data/data/tours-simple.json`;
const tours = JSON.parse(fs.readFileSync(PATH));

exports.getAllTours = (req, res) => {
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: { tours },
  });
};

exports.getTour = (req, res) => {
  const id = req.params.id * 1;
  const tour = tours.find((el) => el.id === id);

  if (!tour) {
    res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
  } else {
    res.json({
      status: 'success',
      tour,
    });
  }
};

exports.addTour = (req, res) => {
  console.log(req.body);
  const newTour = { id: tours[tours.length - 1].id + 1, ...req.body };
  tours.push(newTour);
  fs.writeFile(PATH, JSON.stringify(tours), (err) => {
    res.status(201).json({
      status: 'success',
      data: newTour,
    });
  });
};

exports.updateTour = (req, res) => {
  if (req.params.id * 1 > tours.length - 1) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour: '<New Updated Tour>',
    },
  });
};

exports.deleteTour = (req, res) => {
  if (req.params.id * 1 > tours.length - 1) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
};
