var Queue = require('bull')
var http = require('http')
var cluster = require('cluster')

var PORT = 8000

var voteQueue = Queue('vote', 6379, 'redis')

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

  var log = function() {
    var prefix = 'Worker ' + cluster.worker.id + ':'
    Array.prototype.unshift.call(arguments, prefix)
    console.log.apply(this, arguments)
  }

  http.createServer(function(req, res) {

    if(req.url == '/total') {
      var db = new Datastore({ filename: './votes.db' })
      return db.loadDatabase(function(err) {
        if(err) throw err
        db.find({}, function(err, docs) {
          if(err) throw err
          return res.end(docs.length.toString())
        })
      });
    }

    voteQueue.add({ vote:  { date: new Date().toISOString() }})

    res.end('OK')

  }).listen(PORT, function() {
    log('Server listening on port', PORT, '...')
  })
}
