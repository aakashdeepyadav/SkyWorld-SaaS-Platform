import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  seq: {
    type: Number,
    default: 0
  }
});

/**
 * Atomically increment and return the next sequence number for a given key.
 * @param {string} key — e.g. 'project_WEB', 'user_CLT'
 * @returns {Promise<number>}
 */
counterSchema.statics.getNextSequence = async function (key) {
  const counter = await this.findByIdAndUpdate(
    key,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
};

const Counter = mongoose.model('Counter', counterSchema);

export default Counter;
