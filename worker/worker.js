var Queue = require('bull');
var cluster = require('cluster')
var mongoose = require('mongoose')

if(cluster.isMaster) {
  var cpuCount = require('os').cpus().length;

  for(var i = 0; i < cpuCount; i++) {
    cluster.fork();
  }

  cluster.on('exit', function(deadWorker, code, signal) {
    var worker = cluster.fork();

    var newPID = worker.process.pid;
    var oldPID = deadWorker.process.pid;

    console.log('worker '+oldPID+' died.');
    console.log('worker '+newPID+' born.');
  })

} else {

  mongoose.connect('mongodb://mongo:27017/queue')

  var Vote = mongoose.model('Vote', new mongoose.Schema({
    date: String
  }))

  var voteQueue = Queue('vote', 6379, 'redis')

  voteQueue.process(function(job, done) {
    var vote = new Vote(job.data.vote)

    return new Promise(function(resolve, reject){
      vote.save(function(err, doc) {
        if(err) return reject(err)
        console.log('Worker', cluster.worker.id + '#job', job.jobId + ':', 'persisted doc', doc._id)
        return resolve(doc)
      })
    })
  })

}
