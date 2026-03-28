from datetime import datetime, timezone
from flask import jsonify, request
from flask_jwt_extended import jwt_required
from . import api_bp
from ..extensions import db
from ..models.service_step import ServiceStep
from ..schemas.service_step import ServiceStepSchema, ServiceStepUpdateSchema
from ..utils.helpers import save_upload

step_schema = ServiceStepSchema()
steps_schema = ServiceStepSchema(many=True)
step_update_schema = ServiceStepUpdateSchema()


@api_bp.route('/service-steps/record/<int:record_id>', methods=['GET'])
@jwt_required()
def get_steps(record_id):
    steps = ServiceStep.query.filter_by(service_record_id=record_id).order_by(ServiceStep.step_number).all()
    return jsonify(steps_schema.dump(steps))


@api_bp.route('/service-steps/<int:step_id>', methods=['PUT'])
@jwt_required()
def update_step(step_id):
    step = ServiceStep.query.get_or_404(step_id)
    data = request.get_json()

    errors = step_update_schema.validate(data)
    if errors:
        return jsonify({'errors': errors}), 422

    if data.get('status') == 'completed':
        step.completed_at = datetime.now(timezone.utc)

    for key, value in data.items():
        if hasattr(step, key) and key not in ('id', 'service_record_id', 'step_number'):
            setattr(step, key, value)

    db.session.commit()
    return jsonify(step_schema.dump(step))


@api_bp.route('/service-steps/<int:step_id>/photo', methods=['POST'])
@jwt_required()
def upload_step_photo(step_id):
    step = ServiceStep.query.get_or_404(step_id)

    if 'photo' not in request.files:
        return jsonify({'error': 'No photo provided'}), 422

    file = request.files['photo']
    photo_url = save_upload(file, subfolder=f'steps/{step.service_record_id}')

    if not photo_url:
        return jsonify({'error': 'Invalid file type'}), 422

    step.photo_url = photo_url
    db.session.commit()

    return jsonify(step_schema.dump(step))
