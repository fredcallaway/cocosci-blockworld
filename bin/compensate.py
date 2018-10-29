#!/usr/bin/env python2
"""
Approves and bonuses (if applicable) all workers in the database for the
current psiturk project.
"""

from __future__ import print_function
from psiturk.amt_services_wrapper import MTurkServicesWrapper, Participant, init_db, db_session

wrapper = MTurkServicesWrapper()
amt = wrapper.amt_services
config = wrapper.config

init_db()

assert not amt.is_sandbox
assert amt.connect_to_turk()

class ApproveError(Exception): pass
class BonusError(Exception): pass

def approve(participant):
    success = amt.approve_worker(participant.assignmentid)
    if success:
        participant.status = 5
        db_session.add(participant)
        db_session.commit()
    else:
        raise ApproveError()

def bonus(participant):
    if config.has_option('Shell Parameters', 'bonus_message'):
        reason = config.get('Shell Parameters', 'bonus_message')
    else:
        reason = 'Thanks!'
    success = amt.bonus_worker(participant.assignmentid, participant.bonus, reason)
    if success:
        participant.status = 7
        db_session.add(participant)
        db_session.commit()
    else:
        raise BonusError()

def approve_all():
    for participant in Participant.query.filter(Participant.status == 4).all():
        try:
            approve(participant)
            print('Approved ' + participant.workerid)
        except ApproveError:
            print('ERROR approving ' + participant.workerid)

def bonus_all():
    for participant in Participant.query.filter(Participant.status == 5).all():
        participant.bonus = 0.15
        if participant.bonus > 0:
            try:
                bonus(participant)
                print('Bonused ' + participant.workerid)
            except BonusError:
                print('ERROR bonusing ' + participant.workerid)
        else:
            print('No bonus for ' + participant.workerid)

if __name__ == '__main__':
    approve_all()
    bonus_all()



