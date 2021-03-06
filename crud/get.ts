'use strict';

import { Return } from '../api/return';
import { Service } from '../dynamodb/service';

const service = new Service(process.env.TABLENAME, process.env.KEY_ID);
const ret = new Return;

module.exports.handler = (event, context, callback) => {
  ret.cb(callback);

  if(process.env.PERSONAL_RESOURCE){
    const userId = event.requestContext.authorizer.principalId;
    service.setUserId(userId);
  }

  const itemId: string = event.pathParameters[process.env.KEY_ID];

  service.get(itemId)
          .then(result => ret.parseData(result.Item));
}
