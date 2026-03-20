import mongoose from "mongoose";
import users from "../Modals/Auth.js";

export const login = async (req, res) => {
  const { email, name, image } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  try {
    const existingUser = await users.findOne({ email });

    if (!existingUser) {
      const newUser = await users.create({ email, name, image });
      return res.status(201).json({ result: newUser });
    } else {
      // Update name/image on login in case they changed in Google
      existingUser.name = name || existingUser.name;
      existingUser.image = image || existingUser.image;
      await existingUser.save();
      return res.status(200).json({ result: existingUser });
    }
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const updateprofile = async (req, res) => {
  const { id: _id } = req.params;
  const { channelname, description } = req.body;

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  try {
    const updatedata = await users.findByIdAndUpdate(
      _id,
      { $set: { channelname, description } },
      { new: true }
    );
    if (!updatedata) return res.status(404).json({ message: "User not found" });
    return res.status(200).json(updatedata);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getuserbyid = async (req, res) => {
  const { id: _id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }
  try {
    const user = await users.findById(_id);
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};
