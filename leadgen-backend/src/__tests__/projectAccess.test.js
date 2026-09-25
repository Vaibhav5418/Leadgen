const { isAdmin, canAccessProject, getProjectAccessFilter, requireProjectAccess } = require('../middleware/projectAccess');
const Project = require('../models/Project');

jest.mock('../models/Project'); // Mock the mongoose model

describe('Project Access Middleware', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('isAdmin()', () => {
    it('returns true if user is specifically the super admin email', () => {
      expect(isAdmin({ email: 'akshay@kology.co' })).toBe(true);
    });

    it('returns true if user has isAdmin property set to true', () => {
      expect(isAdmin({ isAdmin: true, email: 'someone@example.com' })).toBe(true);
    });

    it('returns true if user has role "admin"', () => {
      expect(isAdmin({ role: 'admin', email: 'someone@example.com' })).toBe(true);
    });

    it('returns false for regular users', () => {
      expect(isAdmin({ role: 'employee', email: 'employee@example.com' })).toBe(false);
    });
  });

  describe('canAccessProject()', () => {
    const project = {
      _id: 'proj123',
      createdBy: 'user123',
      teamMembers: ['member@example.com', 'other@example.com']
    };

    it('allows admin to access any project', () => {
      expect(canAccessProject({ isAdmin: true }, project)).toBe(true);
    });

    it('allows the creator of the project to access it', () => {
      expect(canAccessProject({ _id: 'user123' }, project)).toBe(true);
    });

    it('allows a team member to access the project', () => {
      expect(canAccessProject({ _id: 'user456', email: 'member@example.com' }, project)).toBe(true);
    });

    it('denies access to someone who is neither admin, creator, nor team member', () => {
      expect(canAccessProject({ _id: 'user999', email: 'stranger@example.com' }, project)).toBe(false);
    });
  });

  describe('getProjectAccessFilter()', () => {
    it('returns empty filter for admins (can see everything)', () => {
      expect(getProjectAccessFilter({ isAdmin: true })).toEqual({});
    });

    it('returns $or filter for normal users based on creator or team member', () => {
      const user = { _id: 'user123', email: 'employee@example.com' };
      const filter = getProjectAccessFilter(user);
      
      expect(filter).toHaveProperty('$or');
      expect(filter.$or).toEqual([
        { createdBy: 'user123' },
        { teamMembers: 'employee@example.com' }
      ]);
    });
  });

  describe('requireProjectAccess Middleware', () => {
    let req, res, next;

    beforeEach(() => {
      req = {
        params: {},
        body: {},
        user: { _id: 'user123', email: 'employee@example.com' }
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      next = jest.fn();
    });

    it('returns 400 if no project ID is provided in params or body', async () => {
      await requireProjectAccess(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Project ID is required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 404 if project does not exist', async () => {
      req.params.id = 'proj123';
      Project.findById.mockResolvedValue(null);

      await requireProjectAccess(req, res, next);

      expect(Project.findById).toHaveBeenCalledWith('proj123');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Project not found' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 403 if project exists but user has no access', async () => {
      req.params.id = 'proj123';
      Project.findById.mockResolvedValue({
        _id: 'proj123',
        createdBy: 'someOtherUser',
        teamMembers: ['someoneElse@example.com']
      });

      await requireProjectAccess(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Access denied to this project' });
      expect(next).not.toHaveBeenCalled();
    });

    it('calls next() and attaches req.project if access is granted', async () => {
      req.params.id = 'proj123';
      const mockProject = {
        _id: 'proj123',
        createdBy: 'user123', // User is creator
        teamMembers: []
      };
      Project.findById.mockResolvedValue(mockProject);

      await requireProjectAccess(req, res, next);

      expect(req.project).toEqual(mockProject);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('handles CastError gracefully (invalid MongoDB ObjectId)', async () => {
      req.params.id = 'invalid_id';
      const castError = new Error('Invalid ID');
      castError.name = 'CastError';
      Project.findById.mockRejectedValue(castError);

      await requireProjectAccess(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Invalid project ID format' });
    });
  });
});
