const Group = require("../models/Group");


exports.addSession = async (req, res) =>{
  try{
   const {groupId} = req.params; //from url's /groups/:groupId/sessions

   const {day,time,topic} = req.body;  // this will be sent from the frontend

   // find the various groups from the database

   const group = await Group.findById(groupId);
   if(!group){
    return res.status(404).json({
        message : "Group not found"
    })
   }
    // checking if users is in the group

    const isMember = group.members.some(member=> member.toString() == req.user.id);
    if(!isMember){
        return res.status(403).json({
            message:"You are not in the group"
        })
    }

    // auto rotate leaders
    let leaderId;
    let leaderName="Unknown";

    if(group.members.lenght > 0){
        // move to the next person in members list
        group.lastLeasderIndex = (group.lastLeasderIndex + 1) % group.members.length;
        leaderId = group.members[group.lastLeasderIndex]
    }


    // Create the new session
        const newSession = {
            day,
            time,
            topic,
            leader: leaderId
            // leaderName will be added by frontend after populate
        };

        // Add to timetable
        group.timetable.push(newSession);
        await group.save();

        // Send back success
        res.status(201).json({
            message: "Session added successfully",
            session: newSession
        });
  }
  catch(err){
     res.status(500).json({ message: "Error adding session", error: err.message });
  }
}