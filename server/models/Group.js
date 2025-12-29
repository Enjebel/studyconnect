const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
    name: { type: String, required: true },
    subject: { type: String, required: true },
    description: { type: String },
    admin: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', // Links to the User model
        required: true 
    },
    members: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }],
   
    timetable: [
      {
        day: { type: String, required: true },        // e.g., "Monday"
        time: { type: String, required: true },       // e.g., "10 AM"
        topic: { type: String, required: true },      // e.g., "Database Normalization"
        leader: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },  // who leads
        leaderName: { type: String }                  // for quick display
      }
    ],
    lastLeaderIndex: { type: Number, default: 0 },     // helps rotate leaders automatically
    attendanceRecords: [
      {
        date: { type: Date, required: true },         // when the session happened
        topic: { type: String },                      // same as in timetable
        present: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],  // who attended
        resources: [
          {
            name: { type: String },                   // e.g., "normalization.pdf"
            url: { type: String }                     // link to file
          }
        ]
      }
    ]
}, { timestamps: true });

module.exports = mongoose.model('Group', GroupSchema);