import Knex = require('knex');
import * as moment from 'moment';
import * as crypto from 'crypto';

export class UserModel {

  generateHash(password: string) {
    return crypto.createHash('md5').update(password).digest('hex');
  }

  all(knex: Knex) {
    return knex('um_users as u')
      .select('u.user_id', 'u.username',
      'u.is_active', 'g.group_name', 'pu.people_user_id', 'ps.position_name',
      knex.raw('concat(t.title_name, p.fname, " ", p.lname) as fullname'))
      .innerJoin('um_groups as g', 'g.group_id', 'u.group_id')
      .innerJoin('um_people_users as pu', 'pu.user_id', 'u.user_id')
      .innerJoin('um_people as p', 'p.people_id', 'pu.people_id')
      .leftJoin('um_positions as ps', 'ps.position_id', 'p.position_id')
      .leftJoin('um_titles as t', 't.title_id', 'p.title_id')
      .where('pu.inuse', 'Y')
      .groupBy('u.username');
  }

  getWarehouses(knex: Knex) {
    return knex('wm_warehouses')
      .orderBy('warehouse_name');
  }

  getGroups(knex: Knex) {
    return knex('um_groups')
      .orderBy('group_name');
  }

  getRights(knex: Knex) {
    return knex('um_rights')
      .orderBy('right_name');
  }

  save(knex: Knex, data: any) {
    return knex('um_users')
      .insert(data, 'user_id');
  }

  update(knex: Knex, data: any, userId: string) {
    return knex('um_users')
      .update(data)
      .where('user_id', userId);
  }

  remove(knex: Knex, userId: string) {
    return knex('um_users')
      .where('user_id', userId)
      .del();
  }

  detail(knex: Knex, userId: string) {
    return knex('um_users as u')
      .select('u.user_id', 'u.username', 'u.access_right', 'u.generic_type_id',
      'u.is_active', 'p.position_id', 'ps.position_name', 'u.group_id', 'u.warehouse_id',
      'pu.start_date', 'pu.end_date', 'pu.people_user_id', 'p.people_id',
      knex.raw('concat(t.title_name, p.fname, " ", p.lname) as fullname'))
      .innerJoin('um_people_users as pu', 'pu.user_id', 'u.user_id')
      .innerJoin('um_people as p', 'p.people_id', 'pu.people_id')
      .leftJoin('um_positions as ps', 'ps.position_id', 'p.position_id')
      .leftJoin('um_titles as t', 't.title_id', 'p.title_id')
      .where('pu.inuse', 'Y')
      .where('u.user_id', userId);
  }

  setUnused(knex: Knex, userId: string) {
    return knex('um_people_users')
      .where('user_id', userId)
      .update({ inuse: 'N' });
  }

  savePeople(knex: Knex, data: any) {
    let sql = `INSERT INTO 
    um_people_users(people_user_id, people_id, user_id, start_date, end_date)
    VALUES('${data.people_user_id}', '${data.people_id}', '${data.user_id}', 
    '${data.start_date}', '${data.end_date}') ON DUPLICATE KEY UPDATE
    start_date='${data.start_date}', end_date='${data.end_date}', inuse='Y'
    `;

    return knex.raw(sql);
  }

  getSwitchLogs(knex: Knex, userId: any) {
    return knex('um_people_users as pu')
      .select('t.title_name', 'p.fname', 'p.lname',
      'ps.position_name', 'pu.start_date', 'pu.end_date', 'pu.inuse')
      .innerJoin('um_people as p', 'p.people_id', 'pu.people_id')
      .leftJoin('um_titles as t', 't.title_id', 'p.title_id')
      .leftJoin('um_positions as ps', 'ps.position_id', 'p.position_id')
      .where('pu.user_id', userId)
      .orderBy('pu.start_date', 'DESC');
  }

  getActionLogs(knex: Knex, userId: any) {
    /*
    select 
    from um_logs as l
    inner join um_people_users as pu on pu.people_user_id=l.people_user_id
    left join um_people as p on p.people_id=pu.people_id
    where l.user_id=1
    order by l.action_time desc
    */
    return knex('um_logs as l')
      .select('l.system', 'l.action', 'l.remark',
      'l.action_time', knex.raw('concat(t.title_name, p.fname, " ", p.lname) as people_fullname'),
      'ps.position_name')
      .leftJoin('um_people_users as pu', 'pu.people_user_id', 'l.people_user_id')
      .leftJoin('um_people as p', 'p.people_id', 'pu.people_id')
      .leftJoin('um_titles as t', 't.title_id', 'p.title_id')
      .leftJoin('um_positions as ps', 'ps.position_id', 'p.position_id')
      .where('l.user_id', userId)
      .orderBy('l.action_time', 'DESC');
  }

  changePassword(knex: Knex, userId: any, password: any) {
    return knex('um_users')
      .where('user_id', userId)
      .update({
        password: password
      });
  }
  
}