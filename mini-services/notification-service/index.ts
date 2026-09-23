import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'

const PORT = 3003

const httpServer = createServer((req, res) => {
  // Health check endpoint
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: 'ok', service: 'notification-service', port: PORT }))
    return
  }

  // REST endpoint to emit events (for API routes to trigger notifications)
  if (req.url === '/emit' && req.method === 'POST') {
    let body = ''
    req.on('data', (chunk) => { body += chunk })
    req.on('end', () => {
      try {
        const data = JSON.parse(body)
        const { event, orgId, payload } = data

        if (!event || !orgId) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'event and orgId are required' }))
          return
        }

        // Emit to the organization room
        io.to(`org:${orgId}`).emit(event, payload)
        
        // Also emit to specific role rooms if specified
        if (payload?.role) {
          io.to(`org:${orgId}:role:${payload.role}`).emit(event, payload)
        }

        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ success: true, event, orgId }))
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Invalid JSON' }))
      }
    })
    return
  }

  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'Not found' }))
})

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
})

// Track connected clients
const connectedClients = new Map<string, { orgId: string; role: string; userId: string }>()

io.on('connection', (socket) => {
  console.log(`[SOCKET] Client connected: ${socket.id}`)

  // Join organization room
  socket.on('join-org', (data: { orgId: string; role?: string; userId?: string }) => {
    if (!data?.orgId) return

    const { orgId, role, userId } = data
    socket.join(`org:${orgId}`)
    
    // Join role-specific room
    if (role) {
      socket.join(`org:${orgId}:role:${role}`)
    }

    // Track client
    connectedClients.set(socket.id, { orgId, role: role || '', userId: userId || '' })
    
    console.log(`[SOCKET] ${socket.id} joined org:${orgId} role:${role || 'none'}`)
    
    // Confirm join
    socket.emit('joined', { orgId, role })
  })

  // Handle notification read
  socket.on('notification:read', (data: { notificationId: string; orgId: string }) => {
    if (!data?.notificationId) return
    // Broadcast to org that notification was read
    socket.to(`org:${data.orgId}`).emit('notification:read', data)
  })

  // Handle module access changes
  socket.on('module-access:changed', (data: { orgId: string; teacherId: string; modules: Record<string, boolean> }) => {
    if (!data?.orgId) return
    // Broadcast to org that module access changed
    io.to(`org:${data.orgId}`).emit('module-access:changed', data)
    console.log(`[SOCKET] Module access changed for org:${data.orgId}`)
  })

  // Handle new notification
  socket.on('notification:new', (data: { orgId: string; notification: any }) => {
    if (!data?.orgId) return
    io.to(`org:${data.orgId}`).emit('notification:new', data.notification)
    console.log(`[SOCKET] New notification for org:${data.orgId}`)
  })

  // Handle disconnect
  socket.on('disconnect', () => {
    const client = connectedClients.get(socket.id)
    if (client) {
      console.log(`[SOCKET] ${socket.id} disconnected from org:${client.orgId}`)
      connectedClients.delete(socket.id)
    }
  })

  // Handle errors
  socket.on('error', (error: Error) => {
    console.error(`[SOCKET] Error for ${socket.id}:`, error.message)
  })
})

httpServer.listen(PORT, () => {
  console.log(`🔔 Notification Service running on port ${PORT}`)
  console.log(`   WebSocket: ws://localhost:${PORT}`)
  console.log(`   Health: http://localhost:${PORT}/health`)
  console.log(`   Emit: POST http://localhost:${PORT}/emit`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...')
  io.close(() => {
    httpServer.close(() => {
      process.exit(0)
    })
  })
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down...')
  io.close(() => {
    httpServer.close(() => {
      process.exit(0)
    })
  })
})
