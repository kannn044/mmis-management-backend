import { PeopleModel } from './../models/people';
import * as express from 'express';
const router = express.Router();
import * as wrap from 'co-express';
import * as moment from 'moment';
import * as crypto from 'crypto';

import { UserModel } from '../models/user';

const userModel = new UserModel();
const peopleModel = new PeopleModel();

router.get('/all', wrap(async (req, res, next) => {
  const db = req.db;
  try {
    const rows = await userModel.all(db);
    res.send({ ok: true, rows: rows });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  }
}));

router.get('/warehouses-list', wrap(async (req, res, next) => {
  const db = req.db;
  try {
    const rows = await userModel.getWarehouses(db);
    res.send({ ok: true, rows: rows });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  }
}));

router.get('/groups-list', wrap(async (req, res, next) => {
  const db = req.db;
  try {
    const rows = await userModel.getGroups(db);
    res.send({ ok: true, rows: rows });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  }
}));

router.get('/rights-list', wrap(async (req, res, next) => {
  const db = req.db;
  try {
    const rows = await userModel.getRights(db);
    res.send({ ok: true, rows: rows });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  }
}));

router.get('/action-logs/:userId', wrap(async (req, res, next) => {
  const db = req.db;
  try {
    let userId = req.params.userId;
    const rows = await userModel.getActionLogs(db, userId);
    let logs = [];
    rows.forEach(v => {
      let obj: any = {};
      obj.system = v.system;
      obj.action = v.action;
      obj.remark = v.remark;
      obj.people_fullname = v.people_fullname;
      obj.position_name = v.position_name;
      obj.date = moment(v.action_time, 'x').format('YYYY-MM-DD');
      obj.time = moment(v.action_time, 'x').format('HH:mm:ss');

      logs.push(obj);
    });
    res.send({ ok: true, rows: logs });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  }
}));

router.delete('/:userId', wrap(async (req, res, next) => {
  const db = req.db;
  const userId = req.params.userId;
  if (userId) {
    try {
      await userModel.remove(db, userId);
      res.send({ ok: true });
    } catch (error) {
      res.send({ ok: false, error: error.message });
    }
  } else {
    res.send({ ok: false, error: 'ไม่พบรหัสผู้ใช้งาน' });
  }
}));

router.get('/:userId', wrap(async (req, res, next) => {
  const db = req.db;
  const userId = req.params.userId;
  if (userId) {
    try {
      let detail = await userModel.detail(db, userId);
      res.send({ ok: true, detail: detail[0] });
    } catch (error) {
      res.send({ ok: false, error: error.message });
    }
  } else {
    res.send({ ok: false, error: 'ไม่พบรหัสผู้ใช้งาน' });
  }
}));

router.get('/people/list', wrap(async (req, res, next) => {
  const db = req.db;
  try {
    let rows = await peopleModel.all(db);
    res.send({ ok: true, rows: rows });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
}));

router.get('/switch-logs/:userId', wrap(async (req, res, next) => {
  const db = req.db;
  const userId = req.params.userId;
  if (userId) {
    try {
      let rows = await userModel.getSwitchLogs(db, userId);
      res.send({ ok: true, rows: rows });
    } catch (error) {
      res.send({ ok: false, error: error.message });
    } finally {
      db.destroy();
    }
  } else {
    res.send({ ok: false, error: 'ไม่พบรหัสผู้ใช้งาน' });
  }
}));

router.post('/', wrap(async (req, res, next) => {
  const db = req.db;
  let data = req.body.data;
  if (data.peopleId && data.startDate && data.username && data.password && data.groupId && data.warehouseId && data.isActive && data.rights) {
    try {
      let _data: any = {};
      _data.username = data.username;
      _data.password = userModel.generateHash(data.password);
      _data.warehouse_id = data.warehouseId;
      _data.group_id = data.groupId;
      _data.access_right = data.rights;
      _data.is_active = data.isActive;
      _data.generic_type_id = data.generic_type_id;

      let ids = await userModel.save(db, _data);
      let peopleUser: any = {};
      peopleUser.user_id = ids[0];
      peopleUser.people_user_id = moment().format('x');
      peopleUser.people_id = data.peopleId;
      peopleUser.start_date = data.startDate;
      peopleUser.end_date = data.endDate;
      await userModel.savePeople(db, peopleUser);
      res.send({ ok: true });
    } catch (error) {
      res.send({ ok: false, error: error.message });
    } finally {
      db.destroy();
    }
  } else {
    res.send({ ok: false, error: 'ข้อมูลไม่ครบถ้วน กรุณาตรวจสอบ' });
  }

}));

router.put('/:userId', wrap(async (req, res, next) => {
  const db = req.db;
  let userId = req.params.userId;
  let data = req.body.data;
  if (data.peopleId && data.startDate && data.groupId && data.warehouseId && data.isActive && data.rights) {
    try {
      let _data: any = {};
      if (data.password) _data.password = userModel.generateHash(data.password);
      _data.warehouse_id = data.warehouseId;
      _data.group_id = data.groupId;
      _data.access_right = data.rights;
      _data.is_active = data.isActive;
      _data.generic_type_id = data.generic_type_id;

      await userModel.setUnused(db, userId);
      await userModel.update(db, _data, userId);

      let peopleUser: any = {};
      peopleUser.user_id = userId;
      peopleUser.people_user_id = moment().format('x');
      peopleUser.people_id = data.peopleId;
      peopleUser.start_date = data.startDate;
      peopleUser.end_date = data.endDate;
      await userModel.savePeople(db, peopleUser);
      res.send({ ok: true });
    } catch (error) {
      res.send({ ok: false, error: error.message });
    } finally {
      db.destroy();
    }
  } else {
    res.send({ ok: false, error: 'ข้อมูลไม่ครบถ้วน กรุณาตรวจสอบ' });
  }
}));

router.post('/change-password', wrap(async(req, res, next) => {

  let db = req.db;
  let userId = req.decoded.id;
  let password = req.body.password;

  console.log(req.decoded);

  let encPassword = crypto.createHash('md5').update(password).digest('hex');

  try {
    await userModel.changePassword(db, userId, encPassword);
    res.send({ ok: true });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  }

}));

export default router;