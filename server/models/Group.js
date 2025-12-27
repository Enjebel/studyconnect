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
    }
],
  // why timetable is required: Stores all sessions(day,time,topic,leader) for the group shows in the tab
  //lastLeaderIndex: helps auto-pick next member of each session (rotation)
  //attendanceRecords: stores who came + files shared showing in the attendance tab
  // New field for timetable 
 timetable:[
    {
        day:{ type: String, required: true },
        time:{type:String,required:true},
        topic:{type:String, required:true},
        leader:{type:mongoose.Schema.Types.ObjectId, ref:'User', required:true},
        leaderName:{type:String}
    }
 ],
  lastLeasderIndex:{ type: Number, default: 0}, // helps in rotating leaders
   attendanceRecords: [
    {
        date:{type:Date, required:true}, // when the session was held
         topic:{type:String, required:true}, // topic covered in that session same as in timetable
         present:[{
            type:mongoose.Schema.Types.ObjectId,ref:"User"
         }], // who attended the session
         resources:[{
            name:{type:String}, // for example, maths.pdf
            url:{type:String}   // links to files
         }]
    }
   ]
}, { timestamps: true });

module.exports = mongoose.model('Group', GroupSchema);